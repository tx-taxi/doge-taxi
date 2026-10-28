import { Component } from '@angular/core';
import { SeoService } from '@app/services/seo.service';

@Component({
  selector: 'app-terms-of-service',
  templateUrl: './terms-of-service.component.html',
  standalone: false,
})
export class TermsOfServiceComponent {
  constructor(
    private seoService: SeoService,
  ) { }

  ngOnInit(): void {
    this.seoService.setTitle($localize`:@@tx-taxi.doge.legal.meta.title.2:Terms of Service`);
    this.seoService.setDescription($localize`:@@tx-taxi.doge.legal.meta.desc.2:Terms for using doge.tx.taxi as an informational Dogecoin block and mempool explorer.`);
  }
}
