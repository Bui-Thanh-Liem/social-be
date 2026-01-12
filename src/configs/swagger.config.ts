import swaggerJSDoc from 'swagger-jsdoc'

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'My Express API',
      version: '1.0.0',
      description: 'API documentation using Swagger + Express'
    },
    servers: [
      {
        url: 'http://localhost:3000', // server local
        description: 'Local server'
      }
    ]
  },
  // Nơi swagger-jsdoc sẽ quét để lấy comment JSDoc
  apis: ['./src/routes/*.js', './src/models/*.js']
}

export const swaggerSpec = swaggerJSDoc(options)
