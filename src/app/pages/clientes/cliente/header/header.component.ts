import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'cliente-header',
  standalone: true,
  imports: [],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent {
  public filterForm: FormGroup = this.fb.group({
    fecha: ['', [Validators.required]],
    ubicacion: ['', [Validators.required]],
  })

  constructor(
    public fb: FormBuilder
  ) {}
}
