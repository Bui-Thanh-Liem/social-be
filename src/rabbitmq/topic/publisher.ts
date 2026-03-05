class Publisher {
  RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost:5672'

  constructor() {}
}

export default new Publisher()
