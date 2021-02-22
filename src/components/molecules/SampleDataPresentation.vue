<template>
  <div class="upload-step-overview">
    <div class="upload-step-overview-item">
      <h6><strong>Algemeen</strong></h6>
      <div class="row">
        <div class="col-6">
          <p class="upload-step-overview-item__text">
            <span class="upload-step-overview-item__text-label"
              >Onderbouw:</span
            >
            <span>
              {{ sanitize(substructureText) }}
            </span>
          </p>

          <p class="upload-step-overview-item__text">
            <span class="upload-step-overview-item__text-label">Bouwjaar:</span>
            <span>
              {{
                sample.builtYear
                  ? new Date(sample.builtYear).getFullYear()
                  : "Geen"
              }}
            </span>
          </p>
          <p class="upload-step-overview-item__text">
            <span class="upload-step-overview-item__text-label"
              >Funderingsherstel advies:</span
            >
            <span>
              {{ sanitize(sample.recoveryAdvised ? "Ja" : "Nee") }}
            </span>
          </p>
        </div>
      </div>
    </div>
    <div class="upload-step-overview-item">
      <h6><strong>Omgeving</strong></h6>
      <div class="row">
        <div class="col-6">
          <p class="upload-step-overview-item__text">
            <span class="upload-step-overview-item__text-label"
              >Sondering:</span
            >
            <span>{{ sanitize(sample.cpt) }}</span>
          </p>
        </div>
      </div>
      <div class="row">
        <div class="col-6">
          <p class="upload-step-overview-item__text">
            <span class="upload-step-overview-item__text-label"
              >Maaiveldniveau:</span
            >
            <span>{{ sanitize(sample.groundLevel) }}</span>
          </p>
          <p class="upload-step-overview-item__text">
            <span class="upload-step-overview-item__text-label"
              >Grondwaterniveau:</span
            >
            <span>{{ sanitize(sample.groundWaterLevelNet) }}</span>
          </p>
        </div>
        <div class="col-6">
          <p class="upload-step-overview-item__text">
            <span class="upload-step-overview-item__text-label">Peilbuis:</span>
            <span>{{ sanitize(sample.monitoringWell) }}</span>
          </p>
          <p class="upload-step-overview-item__text">
            <span class="upload-step-overview-item__text-label"
              >Grondwaterniveau bij ontgraving:</span
            >
            <span>{{ sanitize(sample.groundWaterLevelTemp) }}</span>
          </p>
        </div>
      </div>
    </div>
    <div class="upload-step-overview-item">
      <h6><strong>Fundering</strong></h6>
      <div class="row">
        <div class="col-6">
          <p class="upload-step-overview-item__text">
            <span class="upload-step-overview-item__text-label"
              >Funderingstype:</span
            >
            <span>{{ sanitize(foundationTypeText) }}</span>
          </p>
        </div>
      </div>
      <div class="row">
        <div class="col-6">
          <p class="upload-step-overview-item__text">
            <span class="upload-step-overview-item__text-label"
              >Algehele funderingskwaliteit:</span
            >
            <span>{{ sanitize(foundationQualityText) }}</span>
          </p>
          <p class="upload-step-overview-item__text">
            <span class="upload-step-overview-item__text-label"
              >Handhavingstermijn:</span
            >
            <span>{{ sanitize(enforcementTermText) }}</span>
          </p>
        </div>
        <div class="col-6">
          <p class="upload-step-overview-item__text">
            <span class="upload-step-overview-item__text-label"
              >Geconstateerde schade:</span
            >
            <span>{{ sanitize(damageCharacteristicsText) }}</span>
          </p>
          <p class="upload-step-overview-item__text">
            <span class="upload-step-overview-item__text-label"
              >Oorzaak funderingsschade:</span
            >
            <span>{{ sanitize(damageCauseText) }}</span>
          </p>
        </div>
      </div>
    </div>
    <div class="upload-step-overview-item">
      <h6><strong>Palen &amp; hout</strong></h6>
      <div class="row">
        <div class="col-6">
          <p class="upload-step-overview-item__text">
            <span class="upload-step-overview-item__text-label"
              >Paalkop niveau:</span
            >
            <span>{{ sanitize(sample.pileHeadLevel) }}</span>
          </p>
          <p class="upload-step-overview-item__text">
            <span class="upload-step-overview-item__text-label"
              >Paalkop diameter:</span
            >
            <span>{{ sanitize(sample.pileDiameterTop) }}</span>
          </p>
          <p class="upload-step-overview-item__text">
            <span class="upload-step-overview-item__text-label"
              >Hart-op-hart afstand:</span
            >
            <span>{{ sanitize(sample.pileDistanceLength) }}</span>
          </p>
        </div>
        <div class="col-6">
          <p class="upload-step-overview-item__text">
            <span class="upload-step-overview-item__text-label"
              >Paalpunt niveau:</span
            >
            <span>{{ sanitize(sample.pileTipLevel) }}</span>
          </p>
          <p class="upload-step-overview-item__text">
            <span class="upload-step-overview-item__text-label"
              >Paalpunt diameter:</span
            >
            <span>{{ sanitize(sample.pileDiameterBottom) }}</span>
          </p>
          <p class="upload-step-overview-item__text">
            <span class="upload-step-overview-item__text-label"
              >Oplanger lengte:</span
            >
            <span>{{ sanitize(sample.concreteChargerLength) }}</span>
          </p>
        </div>
      </div>
      <hr />
      <div class="row">
        <div class="col-6">
          <p class="upload-step-overview-item__text">
            <span class="upload-step-overview-item__text-label"
              >Houtsoort:</span
            >
            <span class="upload-step-overview-item__input--correct">
              <strong>Vuren</strong>
            </span>
          </p>
          <p class="upload-step-overview-item__text">
            <span class="upload-step-overview-item__text-label"
              >Inslagdiepte:</span
            >
            <span> Waarde </span>
          </p>
          <p class="upload-step-overview-item__text">
            <span class="upload-step-overview-item__text-label"
              >Houtkwaliteit paal:</span
            >
            <span> Waarde </span>
          </p>
          <p class="upload-step-overview-item__text">
            <span class="upload-step-overview-item__text-label"
              >Resterende draagkracht paal:</span
            >
            <span> Waarde </span>
          </p>
        </div>
        <div class="col-6">
          <p class="upload-step-overview-item__text">
            <span class="upload-step-overview-item__text-label"
              >Houtonderzoek:</span
            >
            <span class="upload-step-overview-item__input--correct">
              <strong>Ja</strong>
            </span>
          </p>
          <p class="upload-step-overview-item__text">
            <span class="upload-step-overview-item__text-label"
              >Houtaantasting:</span
            >
            <span> Waarde </span>
          </p>
          <p class="upload-step-overview-item__text">
            <span class="upload-step-overview-item__text-label"
              >Kwaliteit draagkracht paal:</span
            >
            <span> Waarde </span>
          </p>
          <p class="upload-step-overview-item__text">
            <span class="upload-step-overview-item__text-label"
              >Horizontale draagkracht paal:</span
            >
            <span> Waarde </span>
          </p>
        </div>
      </div>
    </div>

    <div class="upload-step-overview-item">
      <h6><strong>Niveaus &amp; kwaliteit</strong></h6>
      <div class="row">
        <div class="col-6">
          <p class="upload-step-overview-item__text">
            <span class="upload-step-overview-item__text-label"
              >Kwaliteit metselwerk:</span
            >
            <span> Waarde </span>
          </p>
          <p class="upload-step-overview-item__text">
            <span class="upload-step-overview-item__text-label"
              >Funderingsbalk:</span
            >
            <span class="upload-step-overview-item__input--correct">
              <strong>Hout</strong>
            </span>
          </p>
          <p class="upload-step-overview-item__text">
            <span class="upload-step-overview-item__text-label"
              >Niveau onderkant funderingsbalk:</span
            >
            <span> Waarde </span>
          </p>
        </div>
        <div class="col-6">
          <p class="upload-step-overview-item__text">
            <span class="upload-step-overview-item__text-label"
              >Niveau onderkant metselwerk:</span
            >
            <span> NAP </span>
          </p>
          <p class="upload-step-overview-item__text">
            <span class="upload-step-overview-item__text-label"
              >Kwaliteit funderingsbalk:</span
            >
            <span> Waarde </span>
          </p>
          <p class="upload-step-overview-item__text">
            <span class="upload-step-overview-item__text-label"
              >Niveau bovenkant funderingsbalk:</span
            >
            <span> Waarde </span>
          </p>
        </div>
      </div>
    </div>
    <div class="upload-step-overview-item">
      <h6><strong>Scheuren</strong></h6>
      <div class="upload-form upload-form--icon-rows">
        <div class="form-row">
          <div class="col-3">
            <div class="form-control-tile has-image has-multicolour">
              <input
                disabled=""
                checked=""
                type="checkbox"
                name="inpandigScheur"
                id="inpandigScheur"
                value="inpandigScheur"
              />
              <label class="form-control-tile-label" for="inpandigScheur">
                <svg
                  height="98"
                  viewBox="0 0 80 98"
                  width="80"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <g
                    class="svg-stroke"
                    fill="none"
                    fill-rule="evenodd"
                    stroke=""
                    stroke-linejoin="round"
                    transform="translate(2 2)"
                  >
                    <g stroke-width="2">
                      <path d="m54.2352 2.0227-1.418 1.41"></path>
                      <path
                        d="m49.577 6.6521-11.34 11.269"
                        stroke-dasharray="4.568 4.568"
                      ></path>
                      <path d="m36.6171 19.5305-1.418 1.41v2"></path>
                      <path
                        d="m35.1986 26.5276v19.729"
                        stroke-dasharray="3.587 3.587"
                      ></path>
                      <path d="m35.1986 48.0505v2l1.721 1.019"></path>
                      <path
                        d="m40.1639 52.9909 30.823 18.25"
                        stroke-dasharray="3.771 3.771"
                      ></path>
                      <g>
                        <path d="m72.6088 72.2009 1.721 1.02"></path>
                        <path d="m1.0389 69.9353 1.731-1.002"></path>
                      </g>
                      <path
                        d="m6.1854 66.9587 25.613-14.813"
                        stroke-dasharray="3.945 3.945"
                      ></path>
                      <path d="m33.5062 51.1579 1.731-1.002"></path>
                    </g>
                    <g
                      stroke-linecap="round"
                      stroke-width="4"
                      transform="translate(0 -.0009)"
                    >
                      <path d="m20.0658 20.7799 35.198-20.779"></path>
                      <path d="m40.1312 65.0758 35.199-20.965"></path>
                      <path d="m40.1312 93.9996 35.199-20.372"></path>
                      <path
                        d="m20.0658 20.7799-20.066 20.94v29.11l40.131 23.17v-29.11z"
                      ></path>
                      <path d="m75.33 73.2213v-29.11l-20.066-44.11"></path>
                    </g>
                  </g>
                </svg>
                <span class="form-control-tile-title">Inpandige scheur</span>
                <span class="form-control-tile-check"></span>
              </label>
            </div>
          </div>
          <div class="col-3">
            <p class="upload-step-overview-item__text">
              <span class="upload-step-overview-item__text-label"
                >Hoeveel scheuren:</span
              >
              <span> 5 </span>
            </p>
            <br />
            <p class="upload-step-overview-item__text">
              <span class="upload-step-overview-item__text-label"
                >Scheur1:</span
              >
              <span> 20 cm </span>
            </p>
            <p class="upload-step-overview-item__text">
              <span class="upload-step-overview-item__text-label"
                >Scheur3:</span
              >
              <span> 20 cm </span>
            </p>
            <p class="upload-step-overview-item__text">
              <span class="upload-step-overview-item__text-label"
                >Scheur5:</span
              >
              <span> 20 cm </span>
            </p>
          </div>
          <div class="col-3">
            <p class="upload-step-overview-item__text">
              <span class="upload-step-overview-item__text-label"
                >Hersteld:</span
              >
              <span class="upload-step-overview-item__input--correct">
                <strong>Ja</strong>
              </span>
            </p>
            <br />
            <p class="upload-step-overview-item__text">
              <span class="upload-step-overview-item__text-label"
                >Scheur2:</span
              >
              <span> 20 cm </span>
            </p>
            <p class="upload-step-overview-item__text">
              <span class="upload-step-overview-item__text-label"
                >Scheur4:</span
              >
              <span> 20 cm </span>
            </p>
          </div>
        </div>
        <hr />
        <div class="form-row">
          <div class="col-3">
            <div class="form-control-tile has-image has-multicolour">
              <input
                disabled=""
                checked=""
                type="checkbox"
                name="voorgevelScheur"
                id="voorgevelScheur"
                value="voorgevelScheur"
              />
              <label class="form-control-tile-label" for="voorgevelScheur">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="80"
                  height="98"
                  viewBox="0 0 80 98"
                >
                  <g fill="none" fill-rule="evenodd" transform="translate(2 2)">
                    <path
                      class="svg-stroke"
                      stroke=""
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="4"
                      d="M55.3299 73.2213v-29.11l-20.065-44.11M.0657 20.7799l35.199-20.779M20.1316 65.0758l35.198-20.778M20.1316 93.9996l35.198-20.372"
                      transform="translate(20)"
                    ></path>
                    <path
                      class="svg-fill"
                      fill=""
                      d="m20.0657 20.779-20.066 20.94v29.11l40.132 23.17v-29.11z"
                    ></path>
                    <path
                      class="svg-stroke"
                      stroke=""
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="4"
                      d="m20.0657 20.779-20.066 20.94v29.11l40.132 23.17v-29.11z"
                    ></path>
                  </g>
                </svg>
                <span class="form-control-tile-title">Voorgevel scheur</span>
                <span class="form-control-tile-check"></span>
              </label>
            </div>
          </div>
          <div class="col-3">
            <p class="upload-step-overview-item__text">
              <span class="upload-step-overview-item__text-label"
                >Hoeveel scheuren:</span
              >
              <span> 5 </span>
            </p>
            <br />
            <p class="upload-step-overview-item__text">
              <span class="upload-step-overview-item__text-label"
                >Scheur1:</span
              >
              <span> 20 cm </span>
            </p>
            <p class="upload-step-overview-item__text">
              <span class="upload-step-overview-item__text-label"
                >Scheur3:</span
              >
              <span> 20 cm </span>
            </p>
            <p class="upload-step-overview-item__text">
              <span class="upload-step-overview-item__text-label"
                >Scheur5:</span
              >
              <span> 20 cm </span>
            </p>
          </div>
          <div class="col-3">
            <p class="upload-step-overview-item__text">
              <span class="upload-step-overview-item__text-label"
                >Hersteld:</span
              >
              <span class="upload-step-overview-item__input--correct">
                <strong>Ja</strong>
              </span>
            </p>
            <br />
            <p class="upload-step-overview-item__text">
              <span class="upload-step-overview-item__text-label"
                >Scheur2:</span
              >
              <span> 20 cm </span>
            </p>
            <p class="upload-step-overview-item__text">
              <span class="upload-step-overview-item__text-label"
                >Scheur4:</span
              >
              <span> 20 cm </span>
            </p>
          </div>
        </div>
        <hr />
                <div class="form-row">
          <div class="col-3">
            <div class="form-control-tile has-image has-multicolour">
              <input
                disabled=""
                checked=""
                type="checkbox"
                name="achtergevelScheur"
                id="achtergevelScheur"
                value="achtergevelScheur"
              />
              <label class="form-control-tile-label" for="achtergevelScheur">
                <svg xmlns="http://www.w3.org/2000/svg" width="80" height="98">
                  <g fill="none" fill-rule="evenodd">
                    <path
                      class="svg-fill"
                      fill=""
                      d="M57.2639 2.0002l-20.065 20.94v29.11l40.131 23.17v-29.11z"
                    ></path>
                    <g class="svg-stroke" stroke="" stroke-linejoin="round">
                      <path
                        stroke-linecap="round"
                        stroke-width="4"
                        d="M22.0656 22.7799l-20.065 20.94v29.11l40.13 23.17v-29.11zm55.2647 52.4414v-29.11l-20.066-44.11M22.0656 22.7799l35.198-20.779M42.1311 67.0758l35.199-20.778m-35.199 49.7018l35.199-20.372"
                      ></path>
                      <path
                        stroke-width="2"
                        d="M57.2639 2.0011l-1.383 1.444"
                      ></path>
                      <path
                        stroke-dasharray="4.162 4.162"
                        stroke-width="2"
                        d="M53.0002 6.4494l-15.802 16.491v25.029"
                      ></path>
                      <path
                        stroke-width="2"
                        d="M37.1984 50.0505v2l1.732 1"
                      ></path>
                      <path
                        stroke-dasharray="3.849 3.849"
                        stroke-width="2"
                        d="M42.2639 54.9753l31.667 18.283"
                      ></path>
                      <path
                        stroke-width="2"
                        d="M75.5979 74.2204l1.732 1"
                      ></path>
                    </g>
                  </g>
                </svg>
                <span class="form-control-tile-title">Achtergevel scheur</span>
                <span class="form-control-tile-check"></span>
              </label>
            </div>
          </div>
          <div class="col-3">
            <p class="upload-step-overview-item__text">
              <span class="upload-step-overview-item__text-label"
                >Hoeveel scheuren:</span
              >
              <span> 5 </span>
            </p>
            <br />
            <p class="upload-step-overview-item__text">
              <span class="upload-step-overview-item__text-label"
                >Scheur1:</span
              >
              <span> 20 cm </span>
            </p>
            <p class="upload-step-overview-item__text">
              <span class="upload-step-overview-item__text-label"
                >Scheur3:</span
              >
              <span> 20 cm </span>
            </p>
            <p class="upload-step-overview-item__text">
              <span class="upload-step-overview-item__text-label"
                >Scheur5:</span
              >
              <span> 20 cm </span>
            </p>
          </div>
          <div class="col-3">
            <p class="upload-step-overview-item__text">
              <span class="upload-step-overview-item__text-label"
                >Hersteld:</span
              >
              <span class="upload-step-overview-item__input--correct">
                <strong>Ja</strong>
              </span>
            </p>
            <br />
            <p class="upload-step-overview-item__text">
              <span class="upload-step-overview-item__text-label"
                >Scheur2:</span
              >
              <span> 20 cm </span>
            </p>
            <p class="upload-step-overview-item__text">
              <span class="upload-step-overview-item__text-label"
                >Scheur4:</span
              >
              <span> 20 cm </span>
            </p>
          </div>
        </div>
      </div>
    </div>
    <div class="upload-step-overview-item">
      <div class="upload-form upload-form--icon-rows">
        <div class="form-row">
          <div class="col-3">
            <div class="form-control-tile has-image has-multicolour">
              <input
                disabled=""
                checked=""
                type="checkbox"
                name="linkergevelScheur"
                id="linkergevelScheur"
                value="linkergevelScheur"
              />
              <label class="form-control-tile-label" for="linkergevelScheur">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="80"
                  height="98"
                  viewBox="0 0 80 98"
                >
                  <g fill="none" fill-rule="evenodd" transform="translate(1 2)">
                    <path
                      class="svg-fill"
                      fill=""
                      d="m36.4503 50.0495-35.45 20.779v-29.109l35.45-20.797z"
                    ></path>
                    <g class="svg-stroke" stroke="" stroke-linejoin="round">
                      <path
                        stroke-width="2"
                        d="m36.4503 48.0495v2l-1.726 1.012"
                      ></path>
                      <path
                        stroke-dasharray="4.121 4.121"
                        stroke-width="2"
                        d="m31.1691 53.1452-26.666 15.631"
                      ></path>
                      <g stroke-width="2" transform="translate(0 40)">
                        <path d="m2.7257 29.819-1.726 1.011v-2"></path>
                        <path
                          stroke-dasharray="3.587 3.587"
                          d="m1.0001 25.2428v-19.729"
                        ></path>
                        <path d="m1.0001 3.7204v-2l1.725-1.012"></path>
                      </g>
                      <path
                        stroke-dasharray="4.122 4.122"
                        stroke-width="2"
                        d="m6.2804 38.6213 26.667-15.645"
                      ></path>
                      <path
                        stroke-width="2"
                        d="m34.7257 21.9338 1.725-1.012v2"
                      ></path>
                      <path
                        stroke-dasharray="3.59 3.59"
                        stroke-width="2"
                        d="m36.4503 26.5119v19.743"
                      ></path>
                      <path
                        stroke-linecap="round"
                        stroke-width="4"
                        d="M20.0656 20.7799l-20.065 20.94v29.11l40.13 23.17v-29.11zM75.3302 73.2213v-29.11l-20.066-44.11M20.0656 20.7799l35.198-20.779M40.131 65.0758l35.199-20.778M40.131 93.9996l35.199-20.372"
                        transform="translate(1)"
                      ></path>
                    </g>
                  </g>
                </svg>
                <span class="form-control-tile-title">Linkergevel scheur</span>
                <span class="form-control-tile-check"></span>
              </label>
            </div>
          </div>
          <div class="col-3">
            <p class="upload-step-overview-item__text">
              <span class="upload-step-overview-item__text-label"
                >Hoeveel scheuren:</span
              >
              <span> 5 </span>
            </p>
            <br />
            <p class="upload-step-overview-item__text">
              <span class="upload-step-overview-item__text-label"
                >Scheur1:</span
              >
              <span> 20 cm </span>
            </p>
            <p class="upload-step-overview-item__text">
              <span class="upload-step-overview-item__text-label"
                >Scheur3:</span
              >
              <span> 20 cm </span>
            </p>
            <p class="upload-step-overview-item__text">
              <span class="upload-step-overview-item__text-label"
                >Scheur5:</span
              >
              <span> 20 cm </span>
            </p>
          </div>
          <div class="col-3">
            <p class="upload-step-overview-item__text">
              <span class="upload-step-overview-item__text-label"
                >Hersteld:</span
              >
              <span class="upload-step-overview-item__input--correct">
                <strong>Ja</strong>
              </span>
            </p>
            <br />
            <p class="upload-step-overview-item__text">
              <span class="upload-step-overview-item__text-label"
                >Scheur2:</span
              >
              <span> 20 cm </span>
            </p>
            <p class="upload-step-overview-item__text">
              <span class="upload-step-overview-item__text-label"
                >Scheur4:</span
              >
              <span> 20 cm </span>
            </p>
          </div>
        </div>
        <hr />
                <div class="form-row">
          <div class="col-3">
            <div class="form-control-tile has-image has-multicolour">
              <input
                disabled=""
                checked=""
                type="checkbox"
                name="rechtergevelScheur"
                id="rechtergevelScheur"
                value="rechtergevelScheur"
              />
              <label class="form-control-tile-label" for="rechtergevelScheur">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="80"
                  height="98"
                  viewBox="0 0 80 98"
                >
                  <g fill="none" fill-rule="evenodd" transform="translate(2 2)">
                    <path
                      class="svg-fill"
                      fill=""
                      d="m75.3301 73.6267-35.199 20.372v-29.109l35.199-19.81z"
                    ></path>
                    <path
                      class="svg-stroke"
                      stroke=""
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="4"
                      d="M20.0655 20.7799l-20.065 20.94v29.11l40.13 23.17v-29.11zM75.3301 73.2213v-29.11l-20.065-44.11M20.0655 20.7799l35.199-20.779M40.1309 65.0758l35.199-20.778M40.1309 93.9996l35.199-20.372"
                    ></path>
                  </g>
                </svg>
                <span class="form-control-tile-title">Rechtergevel scheur</span>
                <span class="form-control-tile-check"></span>
              </label>
            </div>
          </div>
          <div class="col-3">
            <p class="upload-step-overview-item__text">
              <span class="upload-step-overview-item__text-label"
                >Hoeveel scheuren:</span
              >
              <span> 5 </span>
            </p>
            <br />
            <p class="upload-step-overview-item__text">
              <span class="upload-step-overview-item__text-label"
                >Scheur1:</span
              >
              <span> 20 cm </span>
            </p>
            <p class="upload-step-overview-item__text">
              <span class="upload-step-overview-item__text-label"
                >Scheur3:</span
              >
              <span> 20 cm </span>
            </p>
            <p class="upload-step-overview-item__text">
              <span class="upload-step-overview-item__text-label"
                >Scheur5:</span
              >
              <span> 20 cm </span>
            </p>
          </div>
          <div class="col-3">
            <p class="upload-step-overview-item__text">
              <span class="upload-step-overview-item__text-label"
                >Hersteld:</span
              >
              <span class="upload-step-overview-item__input--correct">
                <strong>Ja</strong>
              </span>
            </p>
            <br />
            <p class="upload-step-overview-item__text">
              <span class="upload-step-overview-item__text-label"
                >Scheur2:</span
              >
              <span> 20 cm </span>
            </p>
            <p class="upload-step-overview-item__text">
              <span class="upload-step-overview-item__text-label"
                >Scheur4:</span
              >
              <span> 20 cm </span>
            </p>
          </div>
        </div>
      </div>
    </div>
    <div class="upload-step-overview-item">
      <h6><strong>Vervorming</strong></h6>
      <div class="row">
        <div class="col-6">
          <p class="upload-step-overview-item__text">
            <span class="upload-step-overview-item__text-label"
              >Gevel vervormd:</span
            >
            <span class="upload-step-overview-item__input--correct">
              <strong>Ja</strong>
            </span>
          </p>
          <p class="upload-step-overview-item__text">
            <span class="upload-step-overview-item__text-label"
              >Scheefstand van voor naar achter:</span
            >
            <span> 20 cm </span>
          </p>
          <p class="upload-step-overview-item__text">
            <span class="upload-step-overview-item__text-label"
              >Drempel voorgevel niveau:</span
            >
            <span> 20 cm </span>
          </p>
          <p class="upload-step-overview-item__text">
            <span class="upload-step-overview-item__text-label"
              >Scheve deur- en/of raamkozijn:</span
            >
            <span class="upload-step-overview-item__input--correct">
              <strong>Ja</strong>
            </span>
          </p>
          <a href="#" class="btn btn-submit">Bewerken</a>
        </div>
        <div class="col-6">
          <p class="upload-step-overview-item__text">
            <span class="upload-step-overview-item__text-label"
              >Scheefstand:</span
            >
            <span class="upload-step-overview-item__input--correct">
              <strong>Ja</strong>
            </span>
          </p>
          <p class="upload-step-overview-item__text">
            <span class="upload-step-overview-item__text-label"
              >Scheefstand van links naar rechts:</span
            >
            <span> 20 cm </span>
          </p>
          <p class="upload-step-overview-item__text">
            <span class="upload-step-overview-item__text-label"
              >Drempel achtergevel niveau:</span
            >
            <span> 20 cm </span>
          </p>
          <p class="upload-step-overview-item__text">
            <span class="upload-step-overview-item__text-label"
              >Pandzakkingssnelheid:</span
            >
            <span> 20 cm </span>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import SampleModel from "../../models/Sample";
import * as enums from "config/enums";
export default {
  name: "SampleDataPresentation",
  components: {},
  props: {
    sample: {
      type: SampleModel,
      required: true,
    },
  },
  data() {
    const { sample } = this;
    return {
      substructureText: this.findEnumValue(
        sample.substructure,
        "substructureOptions"
      ),
      foundationTypeText: this.findEnumValue(
        sample.foundationType,
        "foundationTypeOptions"
      ),
      foundationQualityText: this.findEnumValue(
        sample.overallQuality,
        "foundationQualityOptions"
      ),
      damageCharacteristicsText: this.findEnumValue(
        sample.damageCharacteristics,
        "damageCharacteristicsOptions"
      ),
      woodEncroachementText: this.findEnumValue(
        sample.woodEncroachement,
        "woodEncroachement"
      ),
      crackIndoorTypeText: this.findEnumValue(
        sample.crackIndoorType,
        "crackType"
      ),
      crackFacadeFrontTypeText: this.findEnumValue(
        sample.crackFacadeFrontType,
        "crackType"
      ),
      crackFacadeBackTypeText: this.findEnumValue(
        sample.crackFacadeBackType,
        "crackType"
      ),
      crackFacadeLeftTypeText: this.findEnumValue(
        sample.crackFacadeLeftType,
        "crackType"
      ),
      crackFacadeRightTypeText: this.findEnumValue(
        sample.crackFacadeRightType,
        "crackType"
      ),
      constructionPileText: this.findEnumValue(
        sample.constructionPile,
        "constructionPile"
      ),
      damageCauseText: this.findEnumValue(
        sample.damageCause,
        "damageCauseOptions"
      ),
      enforcementTermText: this.findEnumValue(
        sample.enforcementTerm,
        "enforcementTermOptions"
      ),
    };
  },
  methods: {
    findEnumValue(value, _enum) {
      return value ? enums[_enum].find((x) => x.value === value).text : null;
    },
    sanitize(val) {
      return val ? val : "-";
    },
  },
};
</script>
<style lang="scss">
.upload-step-overview-item__text {
  display: flex;
  span:first-child {
    display: flex;
    justify-content: flex-start;
  }

  span:last-child {
    margin: 0 5px;
    display: flex;
    flex-grow: 1;
    justify-content: flex-end;
  }
}

.upload-form {
  &--icon-rows {
    hr {
      margin: 0 0 20px;
    }
    .form-row {
      padding-bottom: 20px;

      &:last-child {
        padding-bottom: 0;
      }
    }
  }
}
</style>
