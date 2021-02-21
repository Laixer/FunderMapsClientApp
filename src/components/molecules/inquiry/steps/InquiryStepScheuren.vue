<template>
  <InquirySampleStep
    title="Scheuren"
    @save="save"
    :is-active="isActive"
    :is-completed="isCompleted"
    :feedback="feedback"
    @select="$emit('select')"
  >
    <Feedback :feedback="internalFeedback" />

    <!-- Indoor -->
    <div class="form-row">
      <div class="col">
        <div class="form-control-tile has-image has-multicolour">
          <input
            v-model="crackIndoorEnabled"
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
                  <path d="m54.2352 2.0227-1.418 1.41" />
                  <path
                    d="m49.577 6.6521-11.34 11.269"
                    stroke-dasharray="4.568 4.568"
                  />
                  <path d="m36.6171 19.5305-1.418 1.41v2" />
                  <path
                    d="m35.1986 26.5276v19.729"
                    stroke-dasharray="3.587 3.587"
                  />
                  <path d="m35.1986 48.0505v2l1.721 1.019" />
                  <path
                    d="m40.1639 52.9909 30.823 18.25"
                    stroke-dasharray="3.771 3.771"
                  />
                  <g>
                    <path d="m72.6088 72.2009 1.721 1.02" />
                    <path d="m1.0389 69.9353 1.731-1.002" />
                  </g>
                  <path
                    d="m6.1854 66.9587 25.613-14.813"
                    stroke-dasharray="3.945 3.945"
                  />
                  <path d="m33.5062 51.1579 1.731-1.002" />
                </g>
                <g
                  stroke-linecap="round"
                  stroke-width="4"
                  transform="translate(0 -.0009)"
                >
                  <path d="m20.0658 20.7799 35.198-20.779" />
                  <path d="m40.1312 65.0758 35.199-20.965" />
                  <path d="m40.1312 93.9996 35.199-20.372" />
                  <path
                    d="m20.0658 20.7799-20.066 20.94v29.11l40.131 23.17v-29.11z"
                  />
                  <path d="m75.33 73.2213v-29.11l-20.066-44.11" />
                </g>
              </g>
            </svg>
            <span class="form-control-tile-title">Inpandige scheur</span>
            <span class="form-control-tile-check"></span>
          </label>
        </div>
      </div>
      <div class="col-9">
        <div class="form-row">
          <div class="col-5">
            <FormField
                                                              :disabled="!crackIndoorEnabled"

              v-model="fields.crackIndoorType.value"
              v-bind="fields.crackIndoorType"
            />
          </div>
          <div class="col-7">
            <FormField
                                                              :disabled="!crackIndoorEnabled"

              v-model="fields.crackIndoorRestored.value"
              v-bind="fields.crackIndoorRestored"
            />
          </div>
        </div>
        <div class="form-row form-row--special">
          <div class="col form-col">
            <FormField
                                                              :disabled="!crackIndoorEnabled"

              v-model="fields.crackIndoorSize.value"
              v-bind="fields.crackIndoorSize"
            />
          </div>
        </div>
      </div>
    </div>
    <hr />

    <!-- FacadeFront -->
    <div class="form-row">
      <div class="col">
        <div class="form-control-tile has-image has-multicolour">
          <input
            v-model="crackFacadeFrontEnabled"
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
                />
                <path
                  class="svg-fill"
                  fill=""
                  d="m20.0657 20.779-20.066 20.94v29.11l40.132 23.17v-29.11z"
                />
                <path
                  class="svg-stroke"
                  stroke=""
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="4"
                  d="m20.0657 20.779-20.066 20.94v29.11l40.132 23.17v-29.11z"
                />
              </g>
            </svg>
            <span class="form-control-tile-title">Voorgevel scheur</span>
            <span class="form-control-tile-check"></span>
          </label>
        </div>
      </div>
      <div class="col-9">
        <div class="form-row">
          <div class="col-5">
            <FormField
                                                  :disabled="!crackFacadeFrontEnabled"

              v-model="fields.crackFacadeFrontType.value"
              v-bind="fields.crackFacadeFrontType"
            />
          </div>
          <div class="col-7">
            <FormField
                                                  :disabled="!crackFacadeFrontEnabled"

              v-model="fields.crackFacadeFrontRestored.value"
              v-bind="fields.crackFacadeFrontRestored"
            />
          </div>
        </div>
        <div class="form-row form-row--special">
          <div class="col form-col">
            <FormField
                                                  :disabled="!crackFacadeFrontEnabled"

              v-model="fields.crackFacadeFrontSize.value"
              v-bind="fields.crackFacadeFrontSize"
            />
          </div>
        </div>
      </div>
    </div>
    <hr />

    <!-- FacadeBack -->
    <div class="form-row">
      <div class="col">
        <div class="form-control-tile has-image has-multicolour">
          <input
            v-model="crackFacadeBackEnabled"
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
                />
                <g class="svg-stroke" stroke="" stroke-linejoin="round">
                  <path
                    stroke-linecap="round"
                    stroke-width="4"
                    d="M22.0656 22.7799l-20.065 20.94v29.11l40.13 23.17v-29.11zm55.2647 52.4414v-29.11l-20.066-44.11M22.0656 22.7799l35.198-20.779M42.1311 67.0758l35.199-20.778m-35.199 49.7018l35.199-20.372"
                  />
                  <path stroke-width="2" d="M57.2639 2.0011l-1.383 1.444" />
                  <path
                    stroke-dasharray="4.162 4.162"
                    stroke-width="2"
                    d="M53.0002 6.4494l-15.802 16.491v25.029"
                  />
                  <path stroke-width="2" d="M37.1984 50.0505v2l1.732 1" />
                  <path
                    stroke-dasharray="3.849 3.849"
                    stroke-width="2"
                    d="M42.2639 54.9753l31.667 18.283"
                  />
                  <path stroke-width="2" d="M75.5979 74.2204l1.732 1" />
                </g>
              </g>
            </svg>
            <span class="form-control-tile-title">Achtergevel scheur</span>
            <span class="form-control-tile-check"></span>
          </label>
        </div>
      </div>
      <div class="col-9">
        <div class="form-row">
          <div class="col-5">
            <FormField
                                      :disabled="!crackFacadeBackEnabled"

              v-model="fields.crackFacadeBackType.value"
              v-bind="fields.crackFacadeBackType"
            />
          </div>
          <div class="col-7">
            <FormField
                                      :disabled="!crackFacadeBackEnabled"

              v-model="fields.crackFacadeBackRestored.value"
              v-bind="fields.crackFacadeBackRestored"
            />
          </div>
        </div>
        <div class="form-row form-row--special">
          <div class="col form-col">
            <FormField
                                      :disabled="!crackFacadeBackEnabled"

              v-model="fields.crackFacadeBackSize.value"
              v-bind="fields.crackFacadeBackSize"
            />
          </div>
        </div>
      </div>
    </div>
    <hr />

    <!-- FacadeLeft -->
    <div class="form-row">
      <div class="col">
        <div class="form-control-tile has-image has-multicolour">
          <input
            v-model="crackFacadeLeftEnabled"
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
                />
                <g class="svg-stroke" stroke="" stroke-linejoin="round">
                  <path stroke-width="2" d="m36.4503 48.0495v2l-1.726 1.012" />
                  <path
                    stroke-dasharray="4.121 4.121"
                    stroke-width="2"
                    d="m31.1691 53.1452-26.666 15.631"
                  />
                  <g stroke-width="2" transform="translate(0 40)">
                    <path d="m2.7257 29.819-1.726 1.011v-2" />
                    <path
                      stroke-dasharray="3.587 3.587"
                      d="m1.0001 25.2428v-19.729"
                    />
                    <path d="m1.0001 3.7204v-2l1.725-1.012" />
                  </g>
                  <path
                    stroke-dasharray="4.122 4.122"
                    stroke-width="2"
                    d="m6.2804 38.6213 26.667-15.645"
                  />
                  <path stroke-width="2" d="m34.7257 21.9338 1.725-1.012v2" />
                  <path
                    stroke-dasharray="3.59 3.59"
                    stroke-width="2"
                    d="m36.4503 26.5119v19.743"
                  />
                  <path
                    stroke-linecap="round"
                    stroke-width="4"
                    d="M20.0656 20.7799l-20.065 20.94v29.11l40.13 23.17v-29.11zM75.3302 73.2213v-29.11l-20.066-44.11M20.0656 20.7799l35.198-20.779M40.131 65.0758l35.199-20.778M40.131 93.9996l35.199-20.372"
                    transform="translate(1)"
                  />
                </g>
              </g>
            </svg>
            <span class="form-control-tile-title">Linkergevel scheur</span>
            <span class="form-control-tile-check"></span>
          </label>
        </div>
      </div>
      <div class="col-9">
        <div class="form-row">
          <div class="col-5">
            <FormField
                          :disabled="!crackFacadeLeftEnabled"

              v-model="fields.crackFacadeLeftType.value"
              v-bind="fields.crackFacadeLeftType"
            />
          </div>
          <div class="col-7">
            <FormField
                          :disabled="!crackFacadeLeftEnabled"

              v-model="fields.crackFacadeLeftRestored.value"
              v-bind="fields.crackFacadeLeftRestored"
            />
          </div>
        </div>
        <div class="form-row form-row--special">
          <div class="col form-col">
            <FormField
                          :disabled="!crackFacadeLeftEnabled"
              v-model="fields.crackFacadeLeftSize.value"
              v-bind="fields.crackFacadeLeftSize"
            />
          </div>
        </div>
      </div>
    </div>
    <hr />

    <!-- FacadeRight -->
    <div class="form-row">
      <div class="col">
        <div class="form-control-tile has-image has-multicolour">
          <input
            v-model="crackFacadeRightEnabled"
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
                />
                <path
                  class="svg-stroke"
                  stroke=""
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="4"
                  d="M20.0655 20.7799l-20.065 20.94v29.11l40.13 23.17v-29.11zM75.3301 73.2213v-29.11l-20.065-44.11M20.0655 20.7799l35.199-20.779M40.1309 65.0758l35.199-20.778M40.1309 93.9996l35.199-20.372"
                />
              </g>
            </svg>
            <span class="form-control-tile-title">Rechtergevel scheur</span>
            <span class="form-control-tile-check"></span>
          </label>
        </div>
      </div>
      <div class="col-9">
        <div class="form-row">
          <div class="col-5">
            <FormField
              :disabled="!crackFacadeRightEnabled"
              v-model="fields.crackFacadeRightType.value"
              v-bind="fields.crackFacadeRightType"
            />
          </div>
          <div class="col-7">
            <FormField
              :disabled="!crackFacadeRightEnabled"
              v-model="fields.crackFacadeRightRestored.value"
              v-bind="fields.crackFacadeRightRestored"
            />
          </div>
        </div>
        <div class="form-row form-row--special">
          <div class="col form-col">
            <FormField
              :disabled="!crackFacadeRightEnabled"
              v-model="fields.crackFacadeRightSize.value"
              v-bind="fields.crackFacadeRightSize"
            />
          </div>
        </div>
      </div>
    </div>
    <hr />
  </InquirySampleStep>
</template>

<script>
import { numeric, decimal, maxValue, minValue } from "vuelidate/lib/validators";
import { crackType } from "config/enums";
import Feedback from "atom/Feedback";

import InquirySampleStep from "molecule/inquiry/InquirySampleStep";
import FormField from "molecule/form/FormField";

import fields from "mixin/fields";

import { mapActions } from "vuex";

export default {
  components: {
    InquirySampleStep,
    FormField,
    Feedback
  },
  mixins: [fields],
  props: {
    isActive: {
      type: Boolean,
      default: false
    },
    isCompleted: {
      type: Boolean,
      default: false
    },
    value: {
      type: Object
    },
    feedback: {
      type: Object,
      default: () => {}
    }
  },
  data() {
    return {
      isDisabled: false,
      internalFeedback: {},
      fields: {
        // Indoor
        crackIndoorType: {
          label: "Type scheur",
          type: "select",
          value: null,
          options: [
            {
              value: null,
              text: "Selecteer een optie"
            }
          ].concat(crackType),
          validationRules: {}
        },
        crackIndoorSize: {
          label: "Scheurgrootte",
          type: "text", // TODO: int
          value: null,
          validationRules: {
            decimal,
            maxValue: maxValue(999),
            minValue: minValue(-999)
          }
        },
        crackIndoorRestored: {
          label: "Scheur hersteld?",
          type: "radio",
          value: null,
          options: [
            {
              value: true,
              text: "Ja"
            },
            {
              value: false,
              text: "Nee"
            }
          ],
          validationRules: {}
        },
        // FacadeFront
        crackFacadeFrontType: {
          label: "Type scheur",
          type: "select",
          value: null,
          options: [
            {
              value: null,
              text: "Selecteer een optie"
            }
          ].concat(crackType),
          validationRules: {}
        },
        crackFacadeFrontSize: {
          label: "Scheurgrootte",
          type: "text", // TODO: int
          value: null,
          validationRules: {
            decimal,
            maxValue: maxValue(999),
            minValue: minValue(-999)
          }
        },
        crackFacadeFrontRestored: {
          label: "Scheur hersteld?",
          type: "radio",
          value: null,
          options: [
            {
              value: true,
              text: "Ja"
            },
            {
              value: false,
              text: "Nee"
            }
          ],
          validationRules: {}
        },
        // FacadeBack
        crackFacadeBackType: {
          label: "Type scheur",
          type: "select",
          value: null,
          options: [
            {
              value: null,
              text: "Selecteer een optie"
            }
          ].concat(crackType),
          validationRules: {
            numeric
          }
        },
        crackFacadeBackSize: {
          label: "Scheurgrootte",
          type: "text", // TODO: int
          value: null,
          validationRules: {
            decimal,
            maxValue: maxValue(999),
            minValue: minValue(-999)
          }
        },
        crackFacadeBackRestored: {
          label: "Scheur hersteld?",
          type: "radio",
          value: null,
          options: [
            {
              value: true,
              text: "Ja"
            },
            {
              value: false,
              text: "Nee"
            }
          ],
          validationRules: {}
        },
        // FacadeLeft
        crackFacadeLeftType: {
          label: "Type scheur",
          type: "select",
          value: null,
          options: [
            {
              value: null,
              text: "Selecteer een optie"
            }
          ].concat(crackType),
          validationRules: {}

        },
        crackFacadeLeftSize: {
          label: "Scheurgrootte",
          type: "text", // TODO: int
          value: null,
          validationRules: {
            decimal,
            maxValue: maxValue(999),
            minValue: minValue(-999)
          }
        },
        crackFacadeLeftRestored: {
          label: "Scheur hersteld?",
          type: "radio",
          value: null,
          options: [
            {
              value: true,
              text: "Ja"
            },
            {
              value: false,
              text: "Nee"
            }
          ],
          validationRules: {}
        },
        // FacadeRight
        crackFacadeRightType: {
          label: "Type scheur",
          type: "select",
          value: null,
          options: [
            {
              value: null,
              text: "Selecteer een optie"
            }
          ].concat(crackType),
          validationRules: {}
        },
        crackFacadeRightSize: {
          label: "Scheurgrootte",
          type: "text", // TODO: int
          value: null,
          validationRules: {
            decimal,
            maxValue: maxValue(999),
            minValue: minValue(-999)
          }
        },
        crackFacadeRightRestored: {
          label: "Scheur hersteld?",
          type: "radio",
          value: null,
          options: [
            {
              value: true,
              text: "Ja"
            },
            {
              value: false,
              text: "Nee"
            }
          ],
          validationRules: {}
        }
      },
      crackIndoorEnabled: this.value
        ? this.value.crackIndoorType !== null
        : false,
      crackFacadeFrontEnabled: this.value
        ? this.value.crackFacadeFrontType !== null
        : false,
      crackFacadeBackEnabled: this.value
        ? this.value.crackFacadeBackType !== null
        : false,
      crackFacadeLeftEnabled: this.value
        ? this.value.crackFacadeLeftType !== null
        : false,
      crackFacadeRightEnabled: this.value
        ? this.value.crackFacadeRightType !== null
        : false
    };
  },
  watch: {
    value: {
      async handler(newValue) {
        await this.initialize(newValue);
      },
      deep: true
    }
  },
  async created() {
    await this.initialize(this.value);
  },
  methods: {
    ...mapActions("samples", ["updateSample", "createSample", "deleteSample"]),
    ...mapActions("address", ["getAddressById", "getAddressSuggestions"]),
    save(next) {
      const val = this.value;

      // Indoor
      val.crackIndoorType =
        this.crackIndoorEnabled && this.fields.crackIndoorType.value
          ? this.fields.crackIndoorType.value
          : null;
      val.crackIndoorSize =
        this.crackIndoorEnabled && this.fields.crackIndoorSize.value
          ? this.fields.crackIndoorSize.value
          : null;
      val.crackIndoorRestored =
        this.crackIndoorEnabled && this.fields.crackIndoorRestored.value
          ? this.fields.crackIndoorRestored.value
          : null;

      // FacadeFront
      val.crackFacadeFrontType =
        this.cracFacadeFrontEnabled && this.fields.crackFacadeFrontType.value
          ? this.fields.crackFacadeFrontType.value
          : null;
      val.crackFacadeFrontSize =
        this.crackFacadeFrontEnabled && this.fields.crackFacadeFrontSize.value
          ? this.fields.crackFacadeFrontSize.value
          : null;
      val.crackFacadeFrontRestored =
        this.crackFacadeFrontEnabled &&
        this.fields.crackFacadeFrontRestored.value
          ? this.fields.crackFacadeFrontRestored.value
          : null;

      // FacadeBack
      val.crackFacadeBackType =
        this.crackFacadeBackEnabled && this.fields.crackFacadeBackType.value
          ? this.fields.crackFacadeBackType.value
          : null;
      val.crackFacadeBackSize =
        this.crackFacadeBackEnabled && this.fields.crackFacadeBackSize.value
          ? this.fields.crackFacadeBackSize.value
          : null;
      val.crackFacadeBackRestored =
        this.crackFacadeBackEnabled && this.fields.crackFacadeBackRestored.value
          ? this.fields.crackFacadeBackRestored.value
          : null;

      // FacadeLeft
      val.crackFacadeLeftType =
        this.crackFacadeLeftEnabled && this.fields.crackFacadeLeftType.value
          ? this.fields.crackFacadeLeftType.value
          : null;
      val.crackFacadeLeftSize =
        this.crackFacadeLeftEnabled && this.fields.crackFacadeLeftSize.value
          ? this.fields.crackFacadeLeftSize.value
          : null;
      val.crackFacadeLeftRestored =
        this.crackFacadeLeftEnabled && this.fields.crackFacadeLeftRestored.value
          ? this.fields.crackFacadeLeftRestored.value
          : null;

      // FacadeRight
      val.crackFacadeRightType =
        this.crackFacadeRightEnabled && this.fields.crackFacadeRightType.value
          ? this.fields.crackFacadeRightType.value
          : null;
      val.crackFacadeRightSize =
        this.crackFacadeRightEnabled && this.fields.crackFacadeRightSize.value
          ? this.fields.crackFacadeRightSize.value
          : null;
      val.crackFacadeRightRestored =
        this.crackFacadeRightEnabled &&
        this.fields.crackFacadeRightRestored.value
          ? this.fields.crackFacadeRightRestored.value
          : null;

      this.$emit("input", val);
      this.$emit("save", { sample: val, next: next });
    },
    async initialize(sample) {
      if (sample) {
        this.setFieldValues({
          // Indoor
          crackIndoorType: sample.crackIndoorType,
          crackIndoorSize: sample.crackIndoorSize,
          crackIndoorRestored: sample.crackIndoorRestored,
          // FacadeFront
          crackFacadeFrontType: sample.crackFacadeFrontType,
          crackFacadeFrontSize: sample.crackFacadeFrontSize,
          crackFacadeFrontRestored: sample.crackFacadeFrontRestored,
          // FacadeBack
          crackFacadeBackType: sample.crackFacadeBackType,
          crackFacadeBackSize: sample.crackFacadeBackSize,
          crackFacadeBackRestored: sample.crackFacadeBackRestored,
          // FacadeLeft
          crackFacadeLeftType: sample.crackFacadeLeftType,
          crackFacadeLeftSize: sample.crackFacadeLeftSize,
          crackFacadeLeftRestored: sample.crackFacadeLeftRestored,
          // FacadeRight
          crackFacadeRightType: sample.crackFacadeRightType,
          crackFacadeRightSize: sample.crackFacadeRightSize,
          crackFacadeRightRestored: sample.crackFacadeRightRestored
        });
      }
    }
  }
};
</script>
