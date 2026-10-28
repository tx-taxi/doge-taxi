import { Component } from '@angular/core';
import { SeoService } from '@app/services/seo.service';

@Component({
  selector: 'app-privacy-policy',
  templateUrl: './privacy-policy.component.html',
  styleUrls: ['./privacy-policy.component.scss'],
  standalone: false,
})
export class PrivacyPolicyComponent {
  constructor(
    private seoService: SeoService,
  ) { }

  ngOnInit(): void {
    this.seoService.setTitle($localize`:@@tx-taxi.doge.legal.meta.title.1:Privacy Policy`);
    this.seoService.setDescription($localize`:@@tx-taxi.doge.legal.meta.desc.1:Privacy notes for doge.tx.taxi, including public Dogecoin data, browser preferences, server logs, and independent verification.`);
  }
}
