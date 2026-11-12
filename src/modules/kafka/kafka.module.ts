// order-service/src/kafka/kafka.module.ts
import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { kafkaConfig } from 'src/config/kafka.config';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'ORDER_SERVICE', // injection token used in the service
        transport: Transport.KAFKA,
        options: {
          client: kafkaConfig.client,
          consumer: kafkaConfig.consumer,
          producer: kafkaConfig.producer,
        },
      },
    ]),
  ],
  exports: [ClientsModule],
})
export class KafkaModule {}
