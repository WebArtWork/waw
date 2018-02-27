import { Component, OnInit } from '@angular/core';

import { UserService } from '../shared/user.service';

@Component({
  selector: 'app-my-profile',
  templateUrl: './my-profile.component.html',
  styleUrls: ['./my-profile.component.scss']
})
export class MyProfileComponent implements OnInit {

  constructor(
    private userService: UserService
  ) { }

  ngOnInit() {
    this.test('MyProfileComponent')
  }

  // Test message. Remove it
  test(component: string) {
    const testMessage = this.userService.testMessage(component)
    const getMessage = this.userService.mongoTestMessage(component)
    console.log(testMessage, getMessage)
  }
}
