import swaggerJsdoc from 'swagger-jsdoc'
import swaggerUi from 'swagger-ui-express'
import env from './env.js'

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Skills Learning Tracker API',
      version: '1.0.0',
      description: 'API documentation for the Skills Learning Tracker application.',
    },
    servers: [
      {
        url: `http://localhost:${env.port}`,
        description: 'Local development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/routes/*.js', './src/controllers/*.js'],
}

const specs = swaggerJsdoc(options)

export { swaggerUi, specs }
