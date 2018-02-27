import { Injectable } from '@angular/core';
import { MongoService } from 'wacom';

@Injectable()
export class UserService {

  constructor(
    private mongo: MongoService
  ) { }
  // Test method. Remove it
  testMessage(component: string): string {
    return `User service has been connected to ${component} \n`
  }
  // Mongo test method. Remove it
  mongoTestMessage(component: string):string {
    return this.mongo.get(component)
  }
}
