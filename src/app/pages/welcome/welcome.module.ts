import { NgModule } from '@angular/core';

import { WelcomeRoutingModule } from './welcome-routing.module';

import { WelcomeComponent } from './welcome.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { CommonModule } from '@angular/common';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzTimePickerModule } from 'ng-zorro-antd/time-picker';
import { NzSelectModule } from 'ng-zorro-antd/select';
@NgModule({
  imports: [
    WelcomeRoutingModule,
    ReactiveFormsModule,
    FormsModule,
    NzFormModule,
    NzButtonModule,
    NzRadioModule,
    NzInputModule,
    NzCheckboxModule,
    CommonModule,
    NzDatePickerModule,
    NzTimePickerModule,
    NzSelectModule
  ],
  declarations: [WelcomeComponent],
  exports: [WelcomeComponent]
})
export class WelcomeModule { }
