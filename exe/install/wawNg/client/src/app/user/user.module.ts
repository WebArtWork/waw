import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ExploreComponent } from './explore/explore.component';
import { MyProfileComponent } from './my-profile/my-profile.component';
import { MySettingComponent } from './my-setting/my-setting.component';
import { ProfileComponent } from './profile/profile.component';
import { UserRoutingModule } from './user-routing.module';
import { UserService } from './shared/user.service';

@NgModule({
  imports: [
    CommonModule,
    UserRoutingModule
  ],
  declarations: [
    ExploreComponent,
    MyProfileComponent,
    MySettingComponent,
    ProfileComponent
  ],
  providers: [
    UserService
  ]
})
export class UserModule { }
