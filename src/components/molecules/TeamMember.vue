<template>
  <div
    class="TeamMember mb-3 d-flex align-items-center" >
    <img class="mr-2 rounded-circle" :src="member.getAvatar()" width="60" height="60" />
    <div class="pl-1 d-flex flex-column flex-grow-1 align-items-start">
      <div class="w-100 d-flex justify-content-between flex-wrap">
        <span class="m-2">{{ member.getUserName() }}</span>
        <span class="text-muted m-2">{{ member.getRoleName() }}</span>
      </div>
      <div class="d-flex justify-content-between w-100">
        <button
          v-if="member.id !== getUserId"
          class="btn btn-light mx-2 rounded-0 font-weight-bold"
          @click="$emit('remove', { id: member.id })">
          Verwijderen
        </button>
        <button
          class=" btn btn-light mx-2 rounded-0 font-weight-bold"
          @click="$emit('edit', { id: member.id })">
          Bewerk
        </button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import { image } from '../../helpers/assets'

import { getUserId } from '../../services/auth'

@Component
export default class TeamMember extends Vue {
  @Prop() private readonly member!: Object;

  get image() { return image; }
  get getUserId() { return getUserId; }
}
</script>

<style lang="scss">
.TeamMember {
  color: $oxford-blue;

  span {
    line-height: 1
  }

  .btn {
    color: $regent-gray;
    font-size: 1rem;
    padding: 0.375rem 0.75rem;

    &:hover, &:active {
      color: darken($regent-gray, 10%)
    }
  }

  &__btna {
    border: 1px solid #CED0DA;
    border-radius: 4px;
    height: 30px;
    color: $oxford-blue;
    cursor: pointer;
    max-width: 120px;

    background: #FFFFFF;
    background: -moz-linear-gradient(top, #FFFFFF 0%, #F2F4F7 100%);
    background: -webkit-linear-gradient(top, #FFFFFF 0%,#F2F4F7 100%);
    background: linear-gradient(to bottom, #FFFFFF 0%,#F2F4F7 100%);
    filter: progid:DXImageTransform.Microsoft.gradient( startColorstr='#FFFFFF', endColorstr='#F2F4F7',GradientType=0 );

    span {
      display: inline-block;
      margin-left: 10px;
      line-height: 1;
    }
  }
}
</style>
