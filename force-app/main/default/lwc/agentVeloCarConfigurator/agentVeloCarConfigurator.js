import { LightningElement, api } from 'lwc';

export default class AgentVeloCarConfigurator extends LightningElement {
    _value;
    lockedResource;

    @api
    get value() {
        return this._value;
    }
    set value(v) {
        this._value = v;
        // Lock the embedded configurator to the model the agent asked for (arrives
        // as the DTO's defaultResourceName, e.g. "de_carModel_summit"). This can be
        // set after mount, so keep it a reactive field so the child re-locks.
        this.lockedResource = v && v.defaultResourceName ? v.defaultResourceName : null;
    }

    get heading() {
        return this._value?.heading || 'Customize your Velo';
    }

    get prompt() {
        return (
            this._value?.prompt ||
            'Personalize your car below — paint, finish, wheels, and interior.'
        );
    }

    // Server-provided model record (JSON) so the embedded configurator renders without a client Apex call.
    get seedModel() {
        return this._value?.modelJson || null;
    }
}
