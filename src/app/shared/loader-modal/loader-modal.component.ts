import { Component } from '@angular/core';
import { LoaderService } from '../../services/loader.service';

@Component({
  selector: 'shared-loader-modal',
  standalone: true,
  imports: [],
  templateUrl: './loader-modal.component.html',
  styleUrl: './loader-modal.component.css'
})
export class LoaderModalComponent {
  constructor(
    public loaderService: LoaderService
  ) {}
}
