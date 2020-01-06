<template>
  <div 
    v-if="hasActiveLayer" 
    class="Legend mb-3">
    <div
      class="Legend__title d-flex pl-3 ml-3">
      <span class="align-self-center">
        LEGENDA
      </span>
    </div>
    <div class="Legend__subtitle d-flex pl-3 ml-3 mt-2">
      <span class="align-self-center">
        {{ legendLabel }}
      </span>
    </div>
    <div>
      <ul class="m-0 p-0 pl-3 ml-3 mb-3 list-unstyled">
        <li 
          v-for="(item, index) in legendItems" 
          :key="index"
          class="d-flex my-2 mr-3 align-items-center">
          <span class="Legend__point" :style="{ backgroundColor: item.color }"></span> 
          <span class="mx-2 flex-grow-1">{{ item.label }}</span>
        </li>
      </ul>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'

export default {
  computed: {
    ...mapGetters('map', [
      'hasActiveLayer',
      'activeLayer'
    ]),
    legendLabel() {
      return this.activeLayer.name
    },
    legendItems() {
      // TODO: Using layer.name, because layer.id is probably different per customer. Confirm with Yorick
      // TODO: Replace with information from layers call
      let layer = this.activeLayer
      switch(layer.name) {
        case 'Funderingstype':
          return [{
            label: 'Houten paal',
            color: '#9E511F'
          }, {
            label: 'Beton paal',
            color: '#7A7A7A'
          }, {
            label: 'Niet onderheid',
            color: '#A30500'
          }, {
            label: 'Hout met oplanger',
            color: '#641C68'
          }, {
            label: 'Overig',
            color: '#FFCD17'
          }]
        case 'Funderingstype Indicatief':
          return [{
            label: 'Hoge kans op houten paal',
            color: '#9E511f'
          }, {
            label: 'Zeer hoge kans op beton paal',
            color: '#7A7A7A'
          }, {
            label: 'Kans op houten paal en betonpaal',
            color: '#A860A6'
          }]
        case 'Handhavingstermijnen':
          return [{
            label: 'ruim 30 jaar verlopen',
            color: '#B61F17'
          }, {
            label: 'reeds 20 - 30 jaar verlopen',
            color: '#C1301B'
          }, {
            label: 'reeds 10 - 20 jaar verlopen',
            color: '#D45925'
          }, {
            label: 'tot 10 jaar verlopen',
            color: '#E78932'
          }, {
            label: 'binnen 10 jaar verlopen',
            color: '#C7BC3B'
          }, {
            label: 'over 10 - 20 jaar verlopen',
            color: '#67B433'
          }, {
            label: 'over 20 - 30 jaar verlopen',
            color: '#28922A'
          }]
        case 'Kwaliteit Funderingen':
          return [{
            label: 'Zeer slechte staat',
            color: '#B61F17'
          }, {
            label: 'Slechte staat',
            color: '#C1301B'
          }, {
            label: 'Twijfelachtige staat',
            color: '#E78932'
          }, {
            label: 'Acceptabele staat',
            color: '#C7BC3B'
          }, {
            label: 'Redelijke staat',
            color: '#67B433'
          }, {
            label: 'Goede staat',
            color: '#28922A'
          }]
        case 'Pandzakking':
          return [{
            label: 'Minder dan 1mm/jaar of rijzing',
            color: '#293575'
          }, {
            label: '1 tot 2 mm/jaar',
            color: '#1261A3'
          }, {
            label: '2 tot 3 mm/jaar',
            color: '#69A8DE'
          }, {
            label: '3 tot 4 mm/jaar',
            color: '#99C1E9'
          }, {
            label: '4 tot 5 mm/jaar',
            color: '#B378B1'
          }, {
            label: '5 tot 6 mm/jaar',
            color: '#A860A6'
          }, {
            label: '6 tot 7 mm/jaar',
            color: '#8F3C8D'
          }, {
            label: '7 tot 8 mm/jaar',
            color: '#641C68'
          }, {
            label: '8 tot 9 mm/jaar',
            color: '#E15601'
          }, {
            label: '9 mm/jaar of meer',
            color: '#A30500'
          }]
      }

      return null
    }
  }
}
</script>

<style lang="scss">

.Legend {
  border-bottom: 1px solid rgba(0, 0, 0, 0.125);

  &__title {
    height: 60px;
  }
  &__subtitle {
    height: 30px
  }
  &__point {
    display: inline-block;
    width: 12px;
    height: 12px;
    border-radius: 6px;
  }
  ul li span:first-child {
    width: 20px;
  }
  ul li {
    line-height: 1
  }
}
</style>