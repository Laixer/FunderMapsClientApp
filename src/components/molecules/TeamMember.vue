<template>
  <div class="TeamMember mb-3 d-flex align-items-center">
    <img
      class="mr-2 rounded-circle"
      :src="member.getAvatar()"
      width="60"
      height="60"
    />
    <div class="pl-1 d-flex flex-column flex-grow-1 align-items-start">
      <div class="w-100 d-flex justify-content-between flex-wrap">
        <span class="mr-3 mb-2">{{ member.getUserName() }}</span>
        <span class="text-muted mb-2">{{ member.getRoleName() }}</span>
      </div>
      <div class="d-flex justify-content-between w-100">
        <b-button
          v-if="member.id !== getUserId()"
          class="font-weight-bold"
          variant="default"
          @click="$emit('remove', { id: member.id })"
        >
          Verwijderen
        </b-button>
        <b-button
          class="font-weight-bold"
          variant="default"
          @click="$emit('edit', { id: member.id })"
        >
          Bewerk
        </b-button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import { image } from "../../helpers/assets";

import { getUserId } from "../../services/auth";

@Component
export default class TeamMember extends Vue {
  @Prop() private readonly member!: Object;

  get image() {
    return image;
  }
  get getUserId() {
    return getUserId;
  }
}
</script>

<style lang="scss">
.TeamMember {
  color: #354052;

  span {
    line-height: 1;
  }

  .btn {
    color: #7f8fa4;

    &:hover,
    &:active {
      color: darken(#7f8fa4, 10%);
    }
  }

  &__btna {
    border: 1px solid #ced0da;
    border-radius: 4px;
    height: 30px;
    color: #354052;
    cursor: pointer;
    max-width: 120px;

    background: #ffffff;
    background: -moz-linear-gradient(top, #ffffff 0%, #f2f4f7 100%);
    background: -webkit-linear-gradient(top, #ffffff 0%, #f2f4f7 100%);
    background: linear-gradient(to bottom, #ffffff 0%, #f2f4f7 100%);
    filter: progid:DXImageTransform.Microsoft.gradient( startColorstr='#FFFFFF', endColorstr='#F2F4F7',GradientType=0 );

    span {
      display: inline-block;
      margin-left: 10px;
      line-height: 1;
    }
  }
}
</style>
