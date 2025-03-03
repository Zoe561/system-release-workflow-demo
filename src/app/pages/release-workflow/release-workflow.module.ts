import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ReleaseWorkflowRoutingModule } from './release-workflow-routing.module';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTimePickerModule } from 'ng-zorro-antd/time-picker';
import { CreatePageComponent } from './create-page/create-page.component';
import { NzIconModule } from 'ng-zorro-antd/icon';
import {  DeleteFill } from '@ant-design/icons-angular/icons';
import { IconDefinition } from '@ant-design/icons-angular';
const icons: IconDefinition[] = [ DeleteFill ];

@NgModule({
  declarations: [
    CreatePageComponent
  ],
  imports: [
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
    NzSelectModule,
    NzIconModule.forChild(icons),
    ReleaseWorkflowRoutingModule,
  ],
  exports:[CreatePageComponent]
})
export class ReleaseWorkflowModule { }
