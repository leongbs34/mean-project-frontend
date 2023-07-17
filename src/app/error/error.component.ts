import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';

@Component({
  templateUrl: './error.component.html',
  styleUrls: ['./error.component.css'],
})
export class ErrorComponent {
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { message: string },
    private dialog: MatDialog
  ) {}
  message = 'An unknown error occurred';

  onClose() {
    this.dialog.closeAll();
  }
}
