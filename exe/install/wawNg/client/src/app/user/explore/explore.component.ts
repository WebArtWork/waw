import { Component, OnInit } from '@angular/core';

import { UserService } from '../shared/user.service';

@Component({
  selector: 'app-explore',
  templateUrl: './explore.component.html',
  styleUrls: ['./explore.component.scss']
})
export class ExploreComponent implements OnInit {

  constructor(
    private userService: UserService
    
  ) { }

  ngOnInit() {
    this.test('ExploreComponent')
  }

  // Test message. Remove it
  test(component: string) {
    const testMessage = this.userService.testMessage(component)
    const getMessage = this.userService.mongoTestMessage(component)
    console.log(testMessage, getMessage)
  }
}
