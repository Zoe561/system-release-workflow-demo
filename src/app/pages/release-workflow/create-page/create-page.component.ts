import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { Subject, takeUntil, debounceTime, distinctUntilChanged, filter } from 'rxjs';
import * as saveAs from 'file-saver';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import * as dayjs from 'dayjs';
import { ReleaseFormData } from '../interfaces/release-form-date.interface';
import { DEPARTMENTS } from '../const/release-workflow.const';

@Component({
  selector: 'app-create-page',
  templateUrl: './create-page.component.html',
  styleUrls: ['./create-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CreatePageComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  readonly baseFilePath = `*:\\****\\換版文件\\${dayjs().format('YYYY')}\\`;

  form!: FormGroup;
  departments: {
    value: string;
    label: string;
  }[] = this.getDepartments();
  divisions: {
    value: string;
    label: string;
  }[] = [];
  isLoading = false;
  errorMessage = '';

  constructor(
    private readonly fb: FormBuilder,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.setupFormSubscriptions();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Form getters
  get requestNumbers(): FormArray {
    return this.form.get('requestNumbers') as FormArray;
  }

  get f() {
    return this.form.controls;
  }

  // Form Initialization
  private initializeForm(): void {
    this.form = this.fb.group({
      riskLevel: ['', [Validators.required]],
      type: ['', [Validators.required]],
      versionType: ['', [Validators.required]],
      changeNumber: [''],
      systemName: ['', [Validators.required]],
      scheduledTime: this.createScheduledTimeGroup(),
      primarySystemCode: ['', [Validators.required]],
      secondarySystemCode: [''],
      changeSubject: ['', [Validators.required]],
      versionTypes: this.createVersionTypesGroup(),
      requestNumbers: this.createRequestNumbersArray(),
      deliverables: this.createDeliverablesGroup(),
      others: [''],
      department: ['', [Validators.required]],
      division: ['', [Validators.required]],
      projectPath: ['', [Validators.required]],
      affectedSystems: ['', [Validators.required]],
      impactAreas: ['', [Validators.required]],
      applicant: this.createApplicantGroup()
    });
  }

  private createScheduledTimeGroup(): FormGroup {
    return this.fb.group({
      date: [null, [Validators.required]],
      time: [null, [Validators.required]]
    });
  }

  private createVersionTypesGroup(): FormGroup {
    return this.fb.group({
      normalVersion: [false],
      newSystem: [false],
      majorChange: [false],
      databaseChange: [false]
    }, { validators: this.atLeastOneChecked() });
  }

  private createRequestNumbersArray(): FormArray {
    return this.fb.array(
      [this.fb.control('', Validators.required)],
      [Validators.required, this.atLeastOneValue]
    );
  }

  private createDeliverablesGroup(): FormGroup {
    return this.fb.group({
      requirementSpec: [false],
      feasibilityReport: [false],
      sourceCodeReport: [false],
      securityCheckForm: [false],
      systemChangeNotice: [false],
      programFunction: [false],
      versionNotice: [false],
      integrationTest: [false],
      userTest: [false],
      codeComparison: [false],
      versionLogs: [false],
      mandatoryTestList: [false],
      sourceInspection: [false]
    });
  }

  private createApplicantGroup(): FormGroup {
    return this.fb.group({
      employeeId: ['', [Validators.required]],
      extension: ['', [Validators.required]]
    });
  }

  // Form Subscriptions
  private setupFormSubscriptions(): void {
    this.setupDepartmentSubscription();
    this.setupDateTimeSubscription();
  }

  private setupDepartmentSubscription(): void {
    this.form.get('department')?.valueChanges.pipe(
      takeUntil(this.destroy$),
      distinctUntilChanged(),
      filter(Boolean)
    ).subscribe(this.updateDivisions.bind(this));
  }

  private setupDateTimeSubscription(): void {
    const dateControl = this.form.get('scheduledTime.date');
    const timeControl = this.form.get('scheduledTime.time');

    dateControl?.valueChanges.pipe(
      takeUntil(this.destroy$),
      filter(Boolean)
    ).subscribe(date => this.onDateChange(date, timeControl?.value));
  }

  // Validators
  private atLeastOneValue(control: AbstractControl): ValidationErrors | null {
    const array = control as FormArray;
    return array.controls.some(ctrl => ctrl.value?.trim())
      ? null
      : { atLeastOne: true };
  }

  private atLeastOneChecked(): ValidatorFn {
    return (formGroup: AbstractControl): ValidationErrors | null => {
      const controls = (formGroup as FormGroup).controls;
      return Object.values(controls).some(control => control.value)
        ? null
        : { atLeastOneRequired: true };
    };
  }

  // Helper Methods
  private getDepartments(): {
    value: string;
    label: string;
  }[] {
    return Object.keys(DEPARTMENTS).map(dept => ({
      value: dept,
      label: dept
    }));
  }

  private updateDivisions(department: string): void {
    this.divisions = DEPARTMENTS[department] || [];
    if (!this.divisions.length) {
      this.form.get('division')?.setValue('');
    }
    this.cdr.markForCheck();
  }

  // updateFilePath(): void {
  //   const { department, division, projectPath } = this.form.value;
    
  //   if (department && division && projectPath) {
  //     const fullPath = `${this.baseFilePath}${department}/${division}/${projectPath}`;
  //     this.form.patchValue({ filePath: fullPath }, { emitEvent: false });
  //   }
  // }

  // Form Actions
  addRequestNumber(): void {
    this.requestNumbers.push(this.fb.control('', Validators.required));
  }

  removeRequestNumber(index: number): void {
    if (this.requestNumbers.length > 1) {
      this.requestNumbers.removeAt(index);
    }
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.form.get(fieldName);
    return field ? (field.invalid && (field.dirty || field.touched)) : false;
  }

  onDateChange(date: Date, currentTime: Date | null): void {
    if (!date || !currentTime) return;

    const newDateTime = new Date(date);
    newDateTime.setHours(currentTime.getHours());
    newDateTime.setMinutes(currentTime.getMinutes());

    this.form.get('scheduledTime.time')?.patchValue(newDateTime, { emitEvent: false });
  }

  // Document Generation
  async generateDoc(): Promise<void> {
    if (this.form.invalid) {
      this.markFormGroupTouched(this.form);
      this.errorMessage = '請檢查必填欄位';
      this.cdr.markForCheck();
      return;
    }

    try {
      this.isLoading = true;
      this.errorMessage = '';
      this.cdr.markForCheck();

      const docData = await this.prepareDocData();
      const doc = await this.createDocument(docData);
      await this.saveDocument(doc);
    } catch (error) {
      console.error('Error generating document:', error);
      this.errorMessage = '文件生成失敗，請稍後再試';
    } finally {
      this.isLoading = false;
      this.cdr.markForCheck();
    }
  }

  private async prepareDocData(): Promise<any> {
    const formValue = this.form.value;
    // this.updateFilePath();
    const { date: dateObj, time: timeObj } = formValue.scheduledTime;

    return {
      changeNumber: formValue.changeNumber,
      filePath: `${this.baseFilePath}${formValue.department}/${formValue.division}/${formValue.projectPath}`,
      ...this.prepareCheckboxData(formValue),
      ...this.prepareTimeData(dateObj, timeObj),
      ...this.prepareFormData(formValue)
    };
  }

  private prepareCheckboxData(formValue: ReleaseFormData): Record<string, string> {
    const checkboxMapping = {
      riskLevel: {
        high: 'riskLevelHigh',
        medium: 'riskLevelMedium',
        low: 'riskLevelLow'
      },
      type: {
        self: 'typeSelf',
        outsource: 'typeOutsource'
      },
      versionType: {
        regular: 'versionTypeRegular',
        nonRegular: 'versionTypeNonRegular',
        emergency: 'versionTypeEmergency'
      }
    };

    return {
      ...this.mapCheckboxValues(checkboxMapping, formValue),
      ...this.mapBooleanToCheckbox(formValue.versionTypes),
      ...this.mapBooleanToCheckbox(formValue.deliverables)
    };
  }

  private mapCheckboxValues(mapping: Record<string, Record<string, string>>, 
                          formValue: any): Record<string, string> {
    return Object.entries(mapping).reduce((acc, [key, values]) => {
      const selectedValue = formValue[key];
      return {
        ...acc,
        ...Object.entries(values).reduce((innerAcc, [value, mappedKey]) => ({
          ...innerAcc,
          [mappedKey]: selectedValue === value ? '■' : '□'
        }), {})
      };
    }, {});
  }

  private mapBooleanToCheckbox(values: Record<string, boolean>): Record<string, string> {
    return Object.entries(values).reduce((acc, [key, value]) => ({
      ...acc,
      [key]: value ? '■' : '□'
    }), {});
  }

  private prepareTimeData(dateObj: Date, timeObj: Date): Record<string, string> {
    return {
      year: dateObj ? dateObj.getFullYear().toString() : '',
      month: dateObj ? String(dateObj.getMonth() + 1).padStart(2, '0') : '',
      day: dateObj ? String(dateObj.getDate()).padStart(2, '0') : '',
      hour: timeObj ? String(timeObj.getHours()).padStart(2, '0') : '',
      minute: timeObj ? String(timeObj.getMinutes()).padStart(2, '0') : ''
    };
  }

  private prepareFormData(formValue: ReleaseFormData): Record<string, any> {
    return {
      systemName: formValue.systemName,
      primarySystemCode: formValue.primarySystemCode,
      secondarySystemCode: formValue.secondarySystemCode,
      changeSubject: formValue.changeSubject,
      requestNumbers: formValue.requestNumbers.join(', '),
      others: formValue.others,
      filePath: `${this.baseFilePath}${formValue.department}/${formValue.division}/${formValue.projectPath}`,
      affectedSystems: formValue.affectedSystems,
      impactAreas: formValue.impactAreas,
      employeeId: formValue.applicant.employeeId,
      extension: formValue.applicant.extension
    };
  }
  private async createDocument(data: any): Promise<any> {
    try {
      const response = await fetch('assets/系統換版申請單(online_ver).docx');
      const templateContent = await response.arrayBuffer();
      const zip = new PizZip(new Uint8Array(templateContent));
      const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true
      });

      doc.setData(data);
      doc.render();
      return doc;
    } catch (error) {
      console.error('Error creating document:', error);
      throw new Error('文件建立失敗');
    }
  }

  private async saveDocument(doc: any): Promise<void> {
    try {
      const out = doc.getZip().generate({
        type: 'blob',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      });

      const fileName = this.generateFileName();
      saveAs(out, fileName);
    } catch (error) {
      console.error('Error saving document:', error);
      throw new Error('文件儲存失敗');
    }
  }

  private generateFileName(): string {
    const formValue = this.form.value;
    const { date: dateObj, time: timeObj } = formValue.scheduledTime;
    const timeData = this.prepareTimeData(dateObj, timeObj);
    return `0 - 系統換版申請單_${timeData['year']}${timeData['month']}${timeData['day']}${timeData['hour']}${timeData['minute']}.docx`;
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach(control => {
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      } else if (control instanceof FormArray) {
        control.controls.forEach(ctrl => {
          if (ctrl instanceof FormGroup) {
            this.markFormGroupTouched(ctrl);
          } else {
            this.markControlTouched(ctrl);
          }
        });
      } else {
        this.markControlTouched(control);
      }
    });
  }

  private markControlTouched(control: AbstractControl): void {
    control.markAsTouched();
    control.markAsDirty();
    control.updateValueAndValidity();
  }

  // Demo Data Loading
  loadDemoData(): void {
    const demoData: Partial<ReleaseFormData> = {
      riskLevel: 'low',
      type: 'self',
      versionType: 'regular',
      changeNumber: '',
      systemName: '換版文件線上平台',
      scheduledTime: {
        date: new Date('2025-01-20'),
        time: new Date('2025-02-20T14:30:00+08:00')
      },
      primarySystemCode: 'TEST',
      secondarySystemCode: '00',
      changeSubject: '優化換版流程',
      versionTypes: {
        normalVersion: true,
        newSystem: false,
        majorChange: false,
        databaseChange: false
      },
      requestNumbers: ['TEST202402001', 'TEST202402002'],
      deliverables: {
        requirementSpec: false,
        feasibilityReport: false,
        sourceCodeReport: false,
        securityCheckForm: false,
        systemChangeNotice: true,
        programFunction: true,
        versionNotice: true,
        integrationTest: true,
        userTest: true,
        codeComparison: true,
        versionLogs: false,
        mandatoryTestList: true,
        sourceInspection: true
      },
      others: '系統效能報告、資料庫最佳化評估報告',
      department: '經紀系統部',
      division: '跨境業務科',
      projectPath: 'TEST\\20250120',
      affectedSystems: '無影響',
      impactAreas: '效能相關',
      applicant: {
        employeeId: '012797',
        extension: '1234'
      }
    };

    this.loadDemoValues(demoData);
  }

  private loadDemoValues(demoData: Partial<ReleaseFormData>): void {
    // 先處理部門，因為它會觸發 divisions 的更新
    if (demoData.department) {
      this.form.patchValue({ department: demoData.department });
    }

    // 處理 requestNumbers
    const requestNumbers = demoData.requestNumbers || [];
    while (this.requestNumbers.length) {
      this.requestNumbers.removeAt(0);
    }
    requestNumbers.forEach((number: any) => {
      this.requestNumbers.push(this.fb.control(number));
    });

    // 更新其餘表單值
    const { department, requestNumbers: _, ...restData } = demoData;
    this.form.patchValue(restData);

    // 強制更新視圖
    this.cdr.markForCheck();
  }
}