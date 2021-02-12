<template>
<div class="steps-wrapper">
  <div class="container">
    <div class="row">
  <div class="col-lg-10 offset-lg-1">
          <ul class="steps">
            <li :class="`steps-item steps-item${headerClasses[0]}`">
              <router-link class="steps-item__link" :to="{ name: 'edit-report-1', params: $route.params }">
                <svg class="steps-item__icon steps-item__fill" height="21" viewBox="0 0 17 21" width="17"
                  xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="m15.555184 5.26773901-5.2274619-5.14176575c-.0818969-.08055433-.1934161-.12597326-.3084202-.12597326h-9.58368008c-.24046324 0-.43562182.19195926-.43562182.42848048v19.71010202c0 .2365212.19515858.4284805.43562182.4284805h14.81114188c.2404633 0 .4356218-.1919593.4356218-.4284805v-14.56833627c0-.11397581-.0461759-.22280985-.1272015-.30250722zm-11.63458762.7309877h3.92059639c.24046324 0 .43562182.19195925.43562182.42848048 0 .23652122-.19515858.42848048-.43562182.42848048h-3.92059639c-.24046324 0-.43562182-.19195926-.43562182-.42848048 0-.23652123.19515858-.42848048.43562182-.42848048zm7.84119282 11.14049249h-7.84119282c-.24046324 0-.43562182-.1919593-.43562182-.4284805s.19515858-.4284805.43562182-.4284805h7.84119282c.2404632 0 .4356218.1919593.4356218.4284805s-.1951586.4284805-.4356218.4284805zm0-2.5708829h-7.84119282c-.24046324 0-.43562182-.1919593-.43562182-.4284805s.19515858-.4284805.43562182-.4284805h7.84119282c.2404632 0 .4356218.1919593.4356218.4284805s-.1951586.4284805-.4356218.4284805zm0-2.5708829h-7.84119282c-.24046324 0-.43562182-.1919592-.43562182-.4284805 0-.2365212.19515858-.4284804.43562182-.4284804h7.84119282c.2404632 0 .4356218.1919592.4356218.4284804 0 .2365213-.1951586.4284805-.4356218.4284805zm0-2.57088286h-7.84119282c-.24046324 0-.43562182-.19195925-.43562182-.42848048 0-.23652122.19515858-.42848048.43562182-.42848048h7.84119282c.2404632 0 .4356218.19195926.4356218.42848048 0 .23652123-.1951586.42848048-.4356218.42848048zm-2.17810915-3.42784383v-5.14176575l5.22746185 5.14176575z"
                    fill="" transform="translate(.814 .18)" />
                </svg>
                <span class="h6 steps-item__title">Rapportinformatie</span>
              </router-link>
            </li>
            <li class="steps-spacer"></li>
            <li :class="`steps-item steps-item${headerClasses[1]}`">
              <router-link class="steps-item__link" :to="{ name: 'edit-report-2', params: $route.params }">
                <svg class="steps-item__icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24"
                  viewBox="0 0 24 24">
                  <g fill="none" fill-rule="evenodd">
                    <g class="steps-item__fill" fill="" fill-rule="nonzero" transform="translate(.545 1.451)">
                      <path
                        d="M18.5950413 5.27946755v-3.90770221c0-.25240482-.2082644-.45725511-.464876-.45725511h-4.394938zM21.5358471 10.3970668l-10.3788223-9.32068826-10.37882232 9.32068826c-.18873967.1700989-.48347107.1582103-.65640496-.0301788-.17386364-.1865601-.15991735-.47554536.02975207-.64472976l10.69214871-9.6023574c.1766529-.16003929.4490703-.16003929.6266529 0l10.6921488 9.6023574c.1896694.1691844.2036157.45908416.0297521.64472976-.1720042.18656-.4667356.2021067-.656405.0301788z" />
                      <path
                        d="m11.1570248 16.003929c0-3.2776047 2.711157-5.9443165 6.0433884-5.9443165.8237604 0 1.6084711.1636973 2.3243802.4590842v-.68954076l-8.3677686-7.51361604-8.3677686 7.51361604v10.74732426c0 .2524048.20826446.4572551.46487603.4572551h10.74049587c-1.7014463-1.0526013-2.8376033-2.9108861-2.8376033-5.0298063zm-.9297521-9.14510228v-.91451023c0-.25240482.2082645-.45725512.4648761-.45725512h.929752c.2566116 0 .4648761.2048503.4648761.45725512v.91451023c0 .25240482-.2082645.45725511-.4648761.45725511h-.929752c-.2566116 0-.4648761-.20485029-.4648761-.45725511z" />
                      <path
                        d="m17.2004132 10.9741227c-2.819938 0-5.1136363 2.2579258-5.1136363 5.0298063 0 2.7737095 2.2936983 5.0298063 5.1136363 5.0298063s5.1136364-2.2560968 5.1136364-5.0298063c0-2.7718805-2.2936984-5.0298063-5.1136364-5.0298063zm.4648761 7.773337c0 .2524048-.2082645.4572551-.4648761.4572551-.2566115 0-.464876-.2048503-.464876-.4572551v-3.6580409c0-.2524048.2082645-.4572551.464876-.4572551.2566116 0 .4648761.2048503.4648761.4572551zm-.4648761-5.0298063c-.2575413 0-.464876-.2048503-.464876-.4572551s.2073347-.4572551.464876-.4572551c.2556818 0 .4648761.2048503.4648761.4572551s-.2091943.4572551-.4648761.4572551z" />
                    </g>
                    <path d="m.545455.536513h22.31405v21.948246h-22.31405z" />
                  </g>
                </svg>
                <span class="h6 steps-item__title">Funderingsgegevens</span>
              </router-link>
            </li>
            <li class="steps-spacer"></li>
            <li :class="`steps-item steps-item${headerClasses[2]}`">
              <router-link class="steps-item__link" :to="{ name: 'edit-report-3', params: $route.params }">
                <svg class="steps-item__icon" xmlns="http://www.w3.org/2000/svg" width="22" height="22"
                  viewBox="0 0 22 22">
                  <g fill="none" fill-rule="evenodd">
                    <g class="steps-item__fill" fill="" fill-rule="nonzero" transform="translate(.5 .492)">
                      <path
                        d="m14.9147727 9.22131148c-3.0545454 0-5.5397727 2.44364752-5.5397727 5.44895682 0 3.0044709 2.4852273 5.4489567 5.5397727 5.4489567 3.0545455 0 5.5397728-2.4444858 5.5397728-5.4489567 0-3.0053093-2.4852273-5.44895682-5.5397728-5.44895682zm3.4917614 4.10767512-3.4909091 3.6524776c-.16875.175205-.4440341.1701751-.6068182.0142512l-2.49375-2.3816133c-.1678977-.1592772-.1730113-.4266952-.0085227-.5918406.1627841-.1659836.4329545-.1701751.6025568-.0092213l2.1826705 2.0831781 3.1934659-3.3423062c.1602272-.1684985.4321022-.1768815.6017045-.0176044.1713068.1592772.1798296.4241804.0196023.5926789z" />
                      <path
                        d="m8.52272727 14.6702683c0-3.3255403 2.64034093-6.04834207 5.96590913-6.26546204v-3.79415052c0-.11149404-.0451705-.21795827-.1244319-.29592027l-4.2613636-4.19150522c-.0801136-.07880029-.18920454-.12323025-.30170454-.12323025h-9.375c-.23522727 0-.42613636.18777943-.42613636.41915052v17.60432188c0 .2313711.19090909.4191506.42613636.4191506h9.38778409c-.80710227-1.0520679-1.29119318-2.355626-1.29119318-3.7723547zm.85227273-13.83196726 4.2613636 4.19150522h-4.2613636zm-6.39204545 4.19150522h3.83522727c.23522727 0 .42613636.18777943.42613636.41915052s-.19090909.41915052-.42613636.41915052h-3.83522727c-.23522728 0-.42613637-.18777943-.42613637-.41915052s.19090909-.41915052.42613637-.41915052zm0 2.51490313h6.81818181c.23522724 0 .42613634.18777943.42613634.41915052s-.1909091.41915052-.42613634.41915052h-6.81818181c-.23522728 0-.42613637-.18777943-.42613637-.41915052s.19090909-.41915052.42613637-.41915052zm4.26136363 5.86810731h-4.26136363c-.23522728 0-.42613637-.1877794-.42613637-.4191505s.19090909-.4191506.42613637-.4191506h4.26136363c.23522727 0 .42613637.1877795.42613637.4191506s-.1909091.4191505-.42613637.4191505zm.85227273-2.5149031h-5.11363636c-.23522728 0-.42613637-.1877795-.42613637-.4191506 0-.231371.19090909-.4191505.42613637-.4191505h5.11363636c.23522727 0 .42613636.1877795.42613636.4191505 0 .2313711-.19090909.4191506-.42613636.4191506z" />
                    </g>
                    <path d="m.5.491803h20.454546v20.119225h-20.454546z" />
                  </g>
                </svg>
                <span class="h6 steps-item__title">Controle overzicht</span>
              </router-link>
            </li>
          </ul>
        </div>
    </div>
  </div>
</div>
</template>

<script>
import { mapGetters } from 'vuex'
import { icon } from 'helper/assets'
import { EventBus } from 'utils/eventBus.js'

export default {
  name: "EditReportHeader",
  computed: {
    ...mapGetters('report', [
      'activeReport'
    ]),
    headerClasses() {
      switch(this.$route.name) {
        case "new-report":
          return ["--active", "", ""];
        case "edit-report-1":
          return ["--active", "", ""];
        case "edit-report-2":
          return ["--completed", "--active", ""];
        case "edit-report-3":
          return ["--completed", "--completed", "--active"];
        default:
          return ["", "", ""]
      }
    }
  },
  methods: {
    icon,
    handleSaveReport() {
      EventBus.$emit('save-report')
    }
  }
}
</script>

<style lang="scss">
@import "~@/sass/common/common";

.steps {
  position: relative;
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  margin: 0;
}

.steps-item {
  position: relative;
  padding-right: 30px;
  height: 40px;
  display: inline-flex;
  align-items: center;

  &--active {
    .steps-item {
      &__title {
        font-weight: 600;
        color: $primary;
      }

      &__fill {
        fill: $primary;
      }
    }

    &::after {
      content: "";
      position: absolute;
      width: 100%;
      height: 2px;
      bottom: -10px;
      left: 0;
      background-color: $primary;
    }
  }

  &--completed {
    .steps-item {
      &__fill {
        fill: $regent-gray;
      }
    }

    &::after {
      content: "";
      position: absolute;
      width: 12px;
      height: 9px;
      right: -15px;
      background-image: url("data:image/svg+xml,%3Csvg height='10' viewBox='0 0 12 10' width='12' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='m456.921953 31.9073174-2.751221-2.7317059-1.170732 1.1707301 3.921953 3.9219525 8.078047-8.0780497-1.17073-1.1902444z' fill='%237f8fa4' fill-rule='evenodd' transform='translate(-453 -25)'/%3E%3C/svg%3E");
    }
  }

  &__title {
    margin-bottom: 0;
    line-height: 20px;
    font-weight: normal;
    color: $regent-gray;
  }

  &__icon {
    margin-right: 15px;
  }

  &__link {
    text-decoration: none;
    display: inline-block;

    &:hover {
      text-decoration: none;

      .steps-item {
        &__title {
          text-decoration: none;
          color: $secondary;
        }
      }
    }

    .steps-item--active &:hover {
      .steps-item__title {
        color: #1991eb;
      }
    }
  }

  &__fill {
    fill: $regent-gray;
  }
}

.steps-spacer {
  display: inline-block;
  list-style-type: none;
  background-image: url("data:image/svg+xml,%3Csvg height='3' viewBox='0 0 30 3' width='30' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='m781 100.996-30 .004' fill='none' stroke='%23ced0da' stroke-width='2' transform='translate(-751 -99)'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: center;
  max-width: 30px;
  width: 100%;
}

.steps-wrapper {
  border-bottom: 1px solid $mischka;
  width: 100%;
  background-color: $white;
}
</style>
