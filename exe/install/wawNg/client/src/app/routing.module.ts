import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { ExploreComponent } from './user/explore/explore.component';
import { UsersComponent } from './admin/users/users.component';
import { MyAdminProfileComponent } from './admin/profile/profile.component';
import { MyProfileComponent } from './user/my-profile/my-profile.component';
import { MySettingComponent } from './user/my-setting/my-setting.component';
import { ProfileComponent } from './user/profile/profile.component';

const app_routing: Routes = [
  {
    path: 'admin', 
    children: [
      { path: 'users', component: UsersComponent },
      { path: 'profile', component: MyAdminProfileComponent }
    ]
  },
  
  { path: 'explore', component: ExploreComponent },
  { path: 'myProfile', component: MyProfileComponent },
  { path: 'mySetting', component: MySettingComponent },
  { path: 'profile', component: ProfileComponent },
];

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forRoot(app_routing)
  ],
  exports: [
    RouterModule
  ],
  declarations: []
})
export class RoutingModule { }
