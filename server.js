const Express = require('express')

const App = Express()

const Mongoose = require('mongoose')

const CORS = require('cors')

const multer = require('multer');

const bodyParser = require('body-parser');

const path = require('path')


App.use(Express.urlencoded({ limit: '50mb', extended: true }))

App.use(Express.json({ limit: '50mb' }))

App.use(CORS())


App.use(bodyParser.json({ limit: '50mb' })); // Adjust '50mb' to your desired size

// Increase the limit for URL-encoded payloads
App.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));


App.use('/uploads', Express.static(path.join(__dirname, 'uploads')));



const connectDB = async () => {
    try {
      await Mongoose.connect('mongodb://localhost:27017/superassistant', {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      console.log('MongoDB connected successfully!');
    } catch (error) {
      console.error('Error connecting to MongoDB:', error.message);
      process.exit(1); // Exit process with failure
    }
  };

  connectDB()


  const Comprehension_Schema = new Mongoose.Schema({

    correctAnswer : {
  
       type : String 
    },
  
    options : {
  
       type : ['']
    },
  
    text : {
  
       type : String 
    }
  
  })
  
    
  
  

const QuestionSchema = new Mongoose.Schema({

    type: {
        type: String,
       
      },
      questionText: {
        type: String,
        
        
      },
      categories: {
        type: [String], // Array of category names
        
      },
      items: [{
        name: {
          type: String,
          
        },
        category: {
          type: String,
         
        }
      }],

      options : {

          type : [String],
          

      },

      correct_cloze_Answer : {

         type : String
      },

      passage : {

         type : String 
      },


      questions : [Comprehension_Schema],

      image: {
        type: String, // Storing Base64 string instead of Buffer
      }
      

})








const formSchema = new Mongoose.Schema({
    questions: [QuestionSchema],

    headerImage: {
      type: String,  // Store the URL of the header image
      required: false,
    },


  });
  
  const Form = Mongoose.model('Form', formSchema);





  const questionSchema = new Mongoose.Schema({
    Cat_question: { type: String, required: false },
    Cloze_question: { type: String, required: false },
    Comp_passage: { type: String, required: false },
  });
  
  // Define a sub-schema for storing each response's structure
  const responseSchema = new Mongoose.Schema({
    cat_response: { type: Mongoose.Schema.Types.Mixed, required: false }, // This will store a complex object for responses
    comp_response: { type: String, required: false },
    cloze_response: { type: String, required: false },
  });
  
  // Define the main response schema with a reference to the questions and responses
  const responseModelSchema = new Mongoose.Schema({
    score: {
      type: Number,
      required: true,
    },
    responses: {
      type: [responseSchema], // Array of responses
      required: true,
    },
    questions: {
      type: [questionSchema], // Array of questions
      required: true,
    },
    U_Email: {
      type: String,
      required: true,
    },
    U_Phone: {
      type: String,
      required: true,
    },
  });
  
  
  const Response_model = Mongoose.model('Response', responseModelSchema);
  




// Define storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, 'uploads/');
    cb(null, uploadPath); // Folder where the images will be stored
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + path.extname(file.originalname);
    cb(null, uniqueSuffix); // Unique filename with extension
  },
});

// Initialize multer with the storage configuration
const upload = multer({ storage });






App.post('/upload-header-image', upload.single('headerImage'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }

  const imageUrl = `/uploads/${req.file.filename}`;  // Image URL to be sent to frontend

  res.json({ imageUrl });  // Send image URL back to frontend
});



App.post('/savequestion' , async(req,res)=>{

   
    const { questions, headerImage } = req.body;

  
    try {
      // Create a new form with the provided questions
      const newForm = new Form({ questions , headerImage });
      
      // Save the form to the database
      await newForm.save();
      
      // Send back a success response with a link (or any other response)
      res.json({
        success: true,
        message: 'Form saved successfully!',
        link: `/form/${newForm._id}`  // Example of a generated link to the saved form
      });
    } catch (error) {
      console.error('Error saving form:', error);
      res.status(500).json({ success: false, message: 'Failed to save form.' });
    }

})




App.get('/api/forms/:OID', async (req, res) => {
  try {
    const data = await Form.find({_id : req.params.OID});

  
    if (data) {
      return res.json(data);
    }
    res.status(404).json({ message: 'Data not found' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});







App.post('/api/save-score' , async(req,res)=>{


  try {
    const { score, User_Responses, User_Question, U_Email, U_Phone } = req.body;

    // Validate data if necessary
    if (!score || !User_Responses || !User_Question || !U_Email || !U_Phone) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Create a new response document
    const newResponse = new Response_model({
      score,
      responses: User_Responses, // Store the responses
      questions: User_Question,  // Store the questions
      U_Email,
      U_Phone,
    });

    // Save to the database
    await newResponse.save();

    // Respond back with a success message
    res.status(200).json({ message: 'Score, questions, and responses saved successfully' });
  } catch (error) {
    console.error('Error saving score:', error);
    res.status(500).json({ error: 'Failed to save score, questions, and responses' });
  }


})




App.listen(5000 , ()=>{

    console.log("Port is running at 5000")
})