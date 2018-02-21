import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { UsersComponent } from './users/users.component';
import { MyAdminProfileComponent } from './profile/profile.component';



const routes: Routes = [
  {
    path: '',
    redirectTo: 'profile',
    pathMatch:'full'
  },
  {
    path: 'profile',
    component: MyAdminProfileComponent
  },
  {
    path: 'users',
    component: UsersComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminRoutingModule { }
