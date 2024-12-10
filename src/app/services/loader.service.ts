import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LoaderService {

  constructor() { }

  loadingSection = signal(false);
  loadingModal = signal(false);

  showSection(){
    this.loadingSection.set(true);
  }

  hideSection(){
    this.loadingSection.set(false);
  }

  showModal(){
    this.loadingModal.set(true);
  }

  hideModal(){
    this.loadingModal.set(false);
  }
}
