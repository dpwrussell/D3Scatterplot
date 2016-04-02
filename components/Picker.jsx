import React from 'react';

export default class Picker extends React.Component {

  // render() {
  //
  //   let { targets, hovering, hoveringStart, hoveringEnd } = this.props;
  //
  //   if (!targets) {
  //     return <h1>"Empty Picker"</h1>;
  //   }
  //
  //   let tds = targets.map(target => {
  //     if (target === hovering) {
  //       return (
  //         <td key={ target } >
  //           <span className="label label-primary"
  //                 onMouseEnter={ hoveringStart.bind(this, target) }
  //                 onMouseLeave={ hoveringEnd }>{ target }</span>
  //         </td>
  //       );
  //     }
  //     return (
  //       <td key={ target } >
  //         <span className="label label-default"
  //               onMouseOver={ this.handleOver }
  //               onMouseEnter={ hoveringStart.bind(this, target) }
  //               onMouseLeave={ hoveringEnd }>{ target }</span>
  //       </td>
  //     );
  //   });
  //
  //   const chunk = 3;
  //   let trs = [];
  //   for (let i=0, len=tds.length; i<len; i+=chunk) {
  //       trs.push(<tr key={ i }>{ tds.slice(i,i+chunk) }</tr>);
  //   }
  //
  //   return (
  //     <div className="panel panel-default">
  //       <div className="panel-heading">Target</div>
  //       <table className="table">
  //         <tbody>
  //           { trs }
  //         </tbody>
  //       </table>
  //     </div>
  //   );
  // }

  render() {

    const { targets, colors, hovering, pivot, selected, hoveringStart, hoveringEnd, selectTarget } = this.props;

    if (!targets) {
      return <h1>"Empty Picker"</h1>;
    }

    const labels = targets.map(target => {

      let labelClass = 'no-select label';
      let color;

      if (target === pivot) {
        // TODO Dieeferentiate the pivot in some other way
        labelClass += ' label-primary';
      } else if (selected.has(target)) {
        color = colors.get(target);
      } else if (target === hovering) {
        color = colors.get(target);
      } else {
        labelClass += ' label-default';
      }

      const style = {
        display: 'inline-block',
        marginLeft: '5px',
        backgroundColor: color
      };

      return (
        <span key={ target }
              className={ labelClass }
              style={ style }
              onMouseOver={ this.handleOver }
              onMouseEnter={ hoveringStart.bind(this, target) }
              onMouseLeave={ hoveringEnd }
              onClick={ selectTarget.bind(this, target) }>{ target }</span>
      );
    });

    const key = Array.from(selected)
      .map(sel => <li key={ sel }><span style={ {color: colors.get(sel)} }>{ pivot } &rarr; { sel }</span></li>)

    return (
      <div className="panel panel-default">
        <div className="panel-heading">Target</div>
        <div>
          { labels }
        </div>
        <div>
          <ul>
            { key }
          </ul>
        </div>
      </div>
    );
  }

}
