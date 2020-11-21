const express = require('express')
const app = express();

const cors = require('cors');
app.use(cors());
app.use(express.json());

const language = require('@google-cloud/language');
const client = new language.LanguageServiceClient();

const PORT = process.env.PORT || 8080

app.post('/', async (req, res) => {
  const text = req.body.text;
  console.log("Length: " + text.length);
  const document = {
    content: text,
    type: 'PLAIN_TEXT',
  };

  const [result] = await client.analyzeEntities({document});
  const entities = result.entities;

  const questionBank = [];

  let response = { flashcards: [] };

  let threshold = 0;
  let x = 0;

  entities.forEach(entity => {
    threshold += entity.salience;
    x++;
  });

  threshold = threshold/x;

  entities.forEach(entity => {
    if (entity.salience > threshold || (entity.type == "PERSON" || entity.type == "LOCATION" || entity.type == "ORGANIZATION" || entity.type == "CONSUMER_GOOD" || entity.type == "WORK_OF_ART")) {
      if (entity.name.trim().indexOf(' ') == -1) {
        
          let key = entity.name;

          let index = text.indexOf(key);
          let period = text.indexOf('.');
          let prevPeriod = period;
          let question = '';

          if (period > index) {
            question = text.substring(0, period).trim();
          } else {
            while (period < index) {
              console.log(period + " " + index);
              prevPeriod = period;
              period = text.indexOf('.', period + 1);
            }
            question = text.substring(prevPeriod, period).trim();
          }

          console.log(key);         
          questionBank.push({[entity.name]: question});

          response['flashcards'].push({ question: question, answer: entity.name })
      }
    }
  });



  console.log(questionBank)

  res.send(JSON.stringify(response));


  // console.log('Entities:');
  // entities.forEach(entity => {
  //   console.log(entity.name);
  //   console.log(` - Type: ${entity.type}, Salience: ${entity.salience}`);
  //   if (entity.metadata && entity.metadata.wikipedia_url) {
  //     console.log(` - Wikipedia URL: ${entity.metadata.wikipedia_url}`);
  //   }
  // });

});

app.listen(PORT, () => {
  console.log('Listening on port ' + PORT + '.');
});
