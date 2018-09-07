var api_access_key = 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';

var elem = document.createElement("div")
var issues_elem = $('#issue_tree').find('.issues')
elem.setAttribute("id", "app");
issues_elem.before(elem);
$('#app').html(`
  <style>
  #app #demo {overflow-x : scroll}
  #app table {border: 2px solid #42b983; border-radius: 3px; background-color: #fff; }
  #app th {background-color: #42b983; color: rgba(255,255,255,0.66); cursor: pointer; -webkit-user-select: none; -moz-user-select: none; -ms-user-select: none; user-select: none; }
  #app td {background-color: #f9f9f9; }
  #app th, td {min-width: 30px; padding: 10px 20px; }
  #app th.active {color: #fff; }
  #app th.active .arrow {opacity: 1; }
  #app .arrow {display: inline-block; vertical-align: middle; width: 0; height: 0; margin-left: 5px; opacity: 0.66; }
  #app .arrow.asc {border-left: 4px solid transparent; border-right: 4px solid transparent; border-bottom: 4px solid #fff; }
  #app .arrow.dsc {border-left: 4px solid transparent; border-right: 4px solid transparent; border-top: 4px solid #fff; }
  </style>
  <div id="demo">
    <demo-grid :data="gridData":columns="gridColumns"> </demo-grid>
  </div>
`);


let issueId = location.href.split('/').slice(-1)[0]
let url = `https://redmine.fs-bdash.com/issues.json?parent_id=${issueId}&status_id=*&limit=100&key=${api_access_key}
`
let param = {type: 'GET', url: url, dataType: 'json'}
var issues = [];
$.ajax(param)
.done(function(data) {
  $.each(data.issues, function(index, issue) {
    row = {
      id: issue.id,
      subject: issue.subject,
      due_date:  issue.due_date,
      status: issue.status.name,
      assignee: issue.assigned_to.name,
      estimated_hours: issue.estimated_hours
    }
    issues.push(row);
  })
  // 元の子チケットの表を非表示
  issues_elem.hide();
})
.fail(function() {
  console.log('ajax error');
});


var vue_url = "https://cdn.jsdelivr.net/npm/vue"
var script = document.createElement("script");
script.setAttribute("type", "text/javascript");
script.setAttribute('src', vue_url);
script.onload = function() {
  // コンポーネントの登録
  Vue.component('demo-grid', {
    template: `
      <div>
        <a v-if="canBulkEdit()":href="makeEditUrl()">一括編集</a>
        <table style="width:100%">
          <thead>
            <tr>
              <th></th>
              <th v-for="key in columnKeys"@click="sortBy(key)":class="{ active: sortKey == key }">
                {{ columns[key] }}
                <span class="arrow" :class="sortOrders[key] > 0 ? 'asc' : 'dsc'"> </span>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="entry in filteredData">
              <td>
                <input type="checkbox" :value="entry['id']" v-model="checked">
              </td>
              <td v-for="key in columnKeys">
                <a v-bind:href="'https://redmine.fs-bdash.com/issues/' + entry[key]" v-if="key === 'id'">
                  {{ entry[key] }}
                </a>
                <template v-else>
                  {{ entry[key] }}
                </template>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    `,
    props: {
      data: Array,
      columns: Object,
    },
    data: function () {
      var sortOrders = {}
      Object.keys(this.columns).forEach(function (key) { sortOrders[key] = 1 })
      return { sortKey: 'id', sortOrders: sortOrders, checked: [] }
    },
    computed: {
      filteredData: function () {
        var sortKey = this.sortKey
        var order = this.sortOrders[sortKey] || 1
        var data = this.data
        if (sortKey) {
          data = data.slice().sort(function (a, b) {
            a = a[sortKey]
            b = b[sortKey]
            return (a === b ? 0 : a > b ? 1 : -1) * order
          })
        }
        return data
      },
      columnKeys: function () {
        return Object.keys(this.columns);
      }
    },
    filters: {
      urlize: function(str) {
        let matched = ('' + str).match(/^\d+$/)
        return matched ? `<a href=https://redmine.fs-bdash.com/issues/${str}>${str}</a>` : str
      }
    },
    methods: {
      sortBy: function (key) {
        this.sortKey = key
        this.sortOrders[key] = this.sortOrders[key] * -1
      },
      makeEditUrl: function() {
        var params = this.checked
          .map(function(id) {
            return "ids[]=" + id;
          })
          .join('&');
        return 'https://redmine.fs-bdash.com/issues/bulk_edit?' + params;
      },
      canBulkEdit: function() {
        return this.checked.length > 0;
      }
    }
  });

  new Vue({
    el: '#demo',
    data: {
      gridColumns: {
        'id':'ID',
        'subject':'タイトル',
        'due_date':'期日',
        'status':'ステータス',
        'assignee':'担当者',
        'estimated_hours':'予定工数'
      },
      gridData: issues,
    }
  });
}
document.body.appendChild(script);

