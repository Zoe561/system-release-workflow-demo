import { Component } from '@angular/core';
import { NzModalService } from 'ng-zorro-antd/modal';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  isCollapsed = false;

  constructor(private modal: NzModalService) {

  }
  onClick() {
    this.modal.info({
      nzTitle: '後臺管理',
      nzContent: '<p>依後續需求開發</p>',
      nzOnOk: () => console.log('Info OK')
    });
  }
}
