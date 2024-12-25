import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LoaderService {

  constructor() { }

  // Para la carga de secciones asincronas
  loadingSection = signal(false);

  showSection(){
    this.loadingSection.set(true);
  }

  hideSection(){
    this.loadingSection.set(false);
  }

  // Para formularios modales
  loadingModal = signal(false);

  showModal(){
    this.loadingModal.set(true);
  }

  hideModal(){
    this.loadingModal.set(false);
  }
}
