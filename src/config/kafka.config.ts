// order-service/src/config/kafka.config.ts
export const kafkaConfig = {
  client: {
    clientId: 'order-service',
    // Read brokers from env in real deployments, fallback for local dev
    brokers: (process.env.KAFKA_BROKERS ?? 'localhost:9092').split(','),
  },
  consumer: {
    // Needed by Nest even on the producer side to read emit() replies
    groupId: 'order-consumer-group',
  },
  producer: {
    // Let Kafka auto-create topics in dev; disable this in production
    allowAutoTopicCreation: true,
  },
};
