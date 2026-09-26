import { Component, OnInit, HostBinding } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Env, StateService } from '@app/services/state.service';
import { WebsocketService } from '@app/services/websocket.service';
import { SeoService } from '@app/services/seo.service';
import { OpenGraphService } from '@app/services/opengraph.service';

@Component({
  selector: 'app-docs',
  templateUrl: './docs.component.html',
  styleUrls: ['./docs.component.scss'],
  standalone: false,
})
export class DocsComponent implements OnInit {

  activeTab = 0;
  env: Env;
  showWebSocketTab = true;
  showFaqTab = true;

  @HostBinding('attr.dir') dir = 'ltr';

  constructor(
    private route: ActivatedRoute,
    private stateService: StateService,
    private websocket: WebsocketService,
    private seoService: SeoService,
    private ogService: OpenGraphService,
  ) { }

  ngOnInit(): void {
    this.websocket.want(['blocks']);
    this.env = this.stateService.env;
    this.showFaqTab = true;

    document.querySelector<HTMLElement>( 'html' ).style.scrollBehavior = 'smooth';
  }

  ngDoCheck(): void {

    const url = this.route.snapshot.url;

    if (url[0]?.path === 'faq' ) {
      this.activeTab = 0;
      this.seoService.setTitle($localize`:@@meta.title.docs.faq:FAQ`);
      this.seoService.setDescription($localize`:@@meta.description.docs.faq:Get answers to common Dogecoin questions, including block timing, AuxPoW, fees, pending observations, transactions, and available explorer data.`);
      this.ogService.setManualOgImage('faq.jpg');
    } else if( url[1]?.path === 'rest' ) {
      this.activeTab = 1;
      this.seoService.setTitle($localize`:@@meta.title.docs.rest:REST API`);
      this.seoService.setDescription($localize`:@@meta.description.docs.rest-bitcoin:Documentation for the doge.tx.taxi REST API: query available Dogecoin block, transaction, address, fee, and network data.`);
    } else if( url[1]?.path === 'websocket' ) {
      this.activeTab = 2;
      this.seoService.setTitle($localize`:@@meta.title.docs.websocket:WebSocket API`);
      this.seoService.setDescription($localize`:@@meta.description.docs.websocket-bitcoin:Documentation for the doge.tx.taxi WebSocket API: receive current Dogecoin block, transaction, address, pending-sample, and provider-freshness updates.`);
    }
  }

  ngOnDestroy(): void {
    document.querySelector<HTMLElement>( 'html' ).style.scrollBehavior = 'auto';
  }
}
