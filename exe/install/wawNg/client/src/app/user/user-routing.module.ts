import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ExploreComponent } from './explore/explore.component';
import { MyProfileComponent } from './my-profile/my-profile.component';
import { MySettingComponent } from './my-setting/my-setting.component';
import { ProfileComponent } from './profile/profile.component';



const routes: Routes = [
  {
    path: '',
    redirectTo: 'profile',
    pathMatch:'full'
  },
  {
    path: 'explore',
    component: ExploreComponent
  },
  {
    path: 'myProfile',
    component: MyProfileComponent
  },
  {
    path: 'mySetting',
    component: MySettingComponent
  },
  {
    path: 'profile',
    component: ProfileComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class UserRoutingModule { }
