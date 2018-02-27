import { Component, OnInit } from '@angular/core';

import { UserService } from '../shared/user.service';

@Component({
  selector: 'app-my-setting',
  templateUrl: './my-setting.component.html',
  styleUrls: ['./my-setting.component.scss']
})
export class MySettingComponent implements OnInit {

  constructor(
    private userService: UserService
  ) { }

  ngOnInit() {
    this.test('MySettingComponent')
  }

  // Test message. Remove it
  test(component: string) {
    const testMessage = this.userService.testMessage(component)
    const getMessage = this.userService.mongoTestMessage(component)
    console.log(testMessage, getMessage)
  }

}
