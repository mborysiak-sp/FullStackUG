<template>
  <div class="login-form">
    <h4>Login</h4>
    <form ref="form">
      <label>Username</label>
      <input
        type="text"
        name="username"
        v-model="username"
        required >
      <label>Password</label>
      <input
        type="password"
        name="password"
        v-model="password"
        required >
      <input type="button" @click="submit" value="Submit">
      <input type="button" @click="clear" value="Clear">
    </form>
  </div>
</template>

<script>
import { mapActions, mapGetters } from "vuex";

export default {
  data () {
    return {
      username: "",
      password: ""
    };
  },
  computed: {
    ...mapGetters(["user"])
  },
  methods: {
    ...mapActions(["login", "logError"]),
    async submit () {
      const user = {
        username: this.username,
        password: this.password
      };
      this.login(user)
        .then(() => {
          this.$router.push({ name: "Home" });
          this.clear();
        })
        .catch((error) => {
          this.logError(error);
          alert(`${error}`);
        });
    },
    clear () {
      this.$refs.form.reset();
    }
  }
};
</script>

<style lang="scss" scoped>
.login-form {
  form {
    padding: 1em;
    input {
      margin: 5px;
    }
    label {
      margin: 5px;
    }
  }
}
</style>
