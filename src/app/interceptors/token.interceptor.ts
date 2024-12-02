import { HttpInterceptorFn } from '@angular/common/http';
import { HttpRequest, HttpHandlerFn } from '@angular/common/http';

export const TokenInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  const token = localStorage.getItem('token');

  if (token) {
    const clonedRequest = req.clone({
      headers: req.headers.set('token', `Bearer ${token}`)
    });
    return next(clonedRequest);
  }

  return next(req);
};
