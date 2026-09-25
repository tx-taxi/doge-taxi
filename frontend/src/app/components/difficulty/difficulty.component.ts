import { Component, Input } from '@angular/core';
import { StateService } from '@app/services/state.service';
@Component({selector:'app-difficulty',templateUrl:'./difficulty.component.html',styleUrls:['./difficulty.component.scss'],standalone:false})
export class DifficultyComponent {
 @Input() showTitle=true; @Input() showProgress=true; @Input() showHalving=false;
 mode='network'; blocks$=this.stateService.blocks$;
 constructor(public stateService:StateService){}
}
