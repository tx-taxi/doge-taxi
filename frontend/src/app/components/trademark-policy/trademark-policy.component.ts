import { Component } from '@angular/core';
import { SeoService } from '@app/services/seo.service';

@Component({
  selector: 'app-trademark-policy',
  templateUrl: './trademark-policy.component.html',
  styleUrls: ['./trademark-policy.component.scss'],
  standalone: false,
})
export class TrademarkPolicyComponent {
  constructor(
    private seoService: SeoService,
  ) { }

  ngOnInit(): void {
    this.seoService.setTitle($localize`:@@tx-taxi.doge.legal.meta.title.3:Trademark & Attribution`);
    this.seoService.setDescription($localize`:@@tx-taxi.doge.legal.meta.desc.3:Trademark and attribution notes for doge.tx.taxi, including upstream mempool/mempool attribution and project independence.`);
  }
}
