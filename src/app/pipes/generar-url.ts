import { HttpClient } from '@angular/common/http';
import { Pipe, PipeTransform } from '@angular/core';
import { ApiService } from '../services/api.service';

@Pipe({
  name: 'signedUrl',
  standalone: true
})
export class SignedUrlPipe implements PipeTransform {
  constructor(
    private apiService: ApiService,
    private http: HttpClient
  ) {}

  transform(fileName: string) {
    this.apiService.signedUrl(fileName).subscribe({
      next(respuesta) {
        return respuesta;
      },
      error: (error) => {
        return error;
      }
    })
  }
}
