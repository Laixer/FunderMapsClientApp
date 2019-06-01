<template>
  <div class="DataRow">
    <template v-for="(item, index) in items">
      <BasicDataItem v-if="item.text" :key="index" :label="item.label" :value="item.value" />
    </template>
    <Divider v-if="divider" />
  </div>
</template>

<script>
import BasicDataItem from 'atom/dataitems/BasicDataItem'
import Divider from 'atom/Divider'

export default {
  name: 'DataRow',
  components: {
    Divider, BasicDataItem
  },
  props: {
    divider: {
      type: boolean,
      default: true
    },
    items: {
      type: Array,
      default: function() {
        return []
      }
    }
  }
}
</script>

<style>
.DataRow {
  height: 86px;
}
</style>
