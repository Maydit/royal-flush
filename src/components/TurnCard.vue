<template>
  <div>
    <h3>
      {{ playerName | turnify }}
    </h3>
    <b-button-toolbar aria-label="Toolbar with button groups and dropdown menu">
      <b-button-group class="mx-1">
        <b-button>Fold</b-button>
        <b-button>Match</b-button>
        <b-button>Check</b-button>
        <b-dropdown class="mx-1" right text="Raise">
          <b-dropdown-item>5</b-dropdown-item>
          <b-dropdown-item>10</b-dropdown-item>
          <b-dropdown-item>15</b-dropdown-item>
          <b-dropdown-item>Custom???</b-dropdown-item>
        </b-dropdown>
      </b-button-group>
      <b-button-group class="mx-1">
        <b-button>&#8656; Undo</b-button>
      </b-button-group>
    </b-button-toolbar>
  </div>
</template>

<script>
export default {
  name: 'TurnCard',
  props: {
    playerName: String
  },
  filters: {
    turnify: function(value) {
      return value + "'s Turn";
    }
  }
}
</script>