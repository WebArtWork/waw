import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ExploreComponent } from './explore/explore.component';
import { MyProfileComponent } from './my-profile/my-profile.component';
import { MySettingComponent } from './my-setting/my-setting.component';
import { ProfileComponent } from './profile/profile.component';

@NgModule({
  imports: [
    CommonModule
  ],
  declarations: [
    ExploreComponent,
    MyProfileComponent,
    MySettingComponent,
    ProfileComponent
  ]
})
export class UserModule { }
