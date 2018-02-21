import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MySettingComponent } from './my-setting.component';

describe('MySettingComponent', () => {
  let component: MySettingComponent;
  let fixture: ComponentFixture<MySettingComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MySettingComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MySettingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
