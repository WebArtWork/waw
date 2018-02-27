import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { WacomModule } from 'wacom';
import { AppComponent } from './app.component';
import { RoutingModule } from './routing.module';
import { UserModule } from './user/user.module';
import { AdminModule } from './admin/admin.module';



@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    RoutingModule,
    WacomModule
  ],
  providers: [
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
