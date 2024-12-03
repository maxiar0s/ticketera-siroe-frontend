import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SignalService {
  dataSignal = signal('');

  constructor() { }

  getDataSignal() {
    return this.dataSignal;
  }

  updateData(newData: string) {
    this.dataSignal.set(newData);
  }
}
