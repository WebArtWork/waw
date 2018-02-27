import { Component, OnInit } from '@angular/core';

import { UserService } from '../shared/user.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {

  constructor(
    private userService: UserService
  ) { }

  ngOnInit() {
    this.test('Profile')
  }

  // Test message. Remove it
  test(component: string) {
    const testMessage = this.userService.testMessage(component) 
    const getMessage = this.userService.mongoTestMessage(component)
    console.log(testMessage, getMessage)
  }

}
