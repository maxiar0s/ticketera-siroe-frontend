import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'shared-options',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './options.component.html',
  styleUrl: './options.component.css'
})
export class OptionsComponent {
  @Output() optionSelected = new EventEmitter<string>();
  public Option:string = 'Todos los ingresos';

  constructor() {}

  changeDesign(option: string) {
    this.Option = option;
    this.optionSelected.emit(option);
  }
}
