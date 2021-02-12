<template>
    <SampleLine
      v-bind:addressId="addressId"
      :open="open"
      :editMode="editMode"
      @save="handleSave"
      @delete="handleDelete"
      @toggle="handleToggle"
    />

    <!-- <div v-show="open" class="Sample__details">
      <SampleDataEditor
        v-if="editMode"
        ref="editor"
        @stored="handleStored"
        @addressSelected="handleAddressSelected"
        :sample="sample"
      />
      <SampleDataPresentation v-if="!editMode" :sample="sample" />
    </div> -->
</template>

<script>
import SampleLine from "molecule/SampleLine";
// import SampleDataPresentation from "molecule/SampleDataPresentation";
// import SampleDataEditor from "organism/SampleDataEditor";

/**
 * Import model.
 */
import AddressModel from "../../models/Address.ts";

export default {
  name: "Sample",
  components: {
    SampleLine,
    // SampleDataPresentation,
    // SampleDataEditor,
  },
  props: {
    sample: {
      type: Object,
      required: true,
    },
    editMode: {
      type: Boolean,
      default: false,
    },
  },
  computed: {
    open() {
      return this.sample.editorState === "open";
    },
    classList() {
      return {
        "SampleLine--open": true,
      };
    }
  },
  data: function() {
    return {
      addressId: null
    }
  },
  methods: {
    handleToggle() {
      if (this.open) {
        this.sample.closeEditor();
      } else {
        this.sample.openEditor();
      }
    },
    /**
     * Called when we select an address from the autocomplete field.
     */
    handleAddressSelected(event) {
      this.addressId = event.addressId;
    },
    async save() {
      return await this.handleSave();
    },
    isStored() {
      return this.$refs.editor ? this.$refs.editor.isStored() : false;
    },
    handleSave() {
      if (this.$refs.editor) {
        return this.$refs.editor.save();
      }
    },
    handleDelete() {
      if (this.$refs.editor) {
        this.$refs.editor.delete();
      }
    },
    handleStored(payload) {
      this.$emit("stored", payload);
    },
  },
  created() {
    // TODO Is this correct?
    this.addressId = this.sample.address;
  }
};
</script>
