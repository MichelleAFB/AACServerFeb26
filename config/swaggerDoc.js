const swaggerUI = require("swagger-ui-express");
const swaggerJsDoc = require("swagger-jsdoc");


const swaggerOptions = {
  swaggerDefinition: {
    info: {
      title: "AAC Server api",
      description: "Aac customer and event information",
      contact: {
        name: "Michelle badu",
      },
      servers: "http://localhost:3002",
    },
  },
  // ['.routes/*.js']
  apis: ["index.js"],
};
//Routes

const swaggerDocs = swaggerJsDoc(swaggerOptions);

module.exports={swaggerUI:swaggerUI,swaggerDocs:swaggerDocs}
