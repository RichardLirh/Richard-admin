<template>
  <div class="task-monitor"><HeaderBar /><iframe :src="monitorUrl" title="小智任务监控（只读）" /></div>
</template>
<script>
import HeaderBar from '@/components/HeaderBar.vue';
export default {
  name: 'TaskMonitor',
  components: { HeaderBar },
  computed: { monitorUrl() { return `${process.env.BASE_URL}local-runs.html`; } }
};
</script>
<style scoped>
.task-monitor{height:100vh;display:flex;flex-direction:column}.task-monitor iframe{border:0;flex:1;width:100%;min-height:650px}
</style>
